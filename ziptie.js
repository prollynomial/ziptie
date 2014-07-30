//     ziptie.js - (c) 2014 Adam Carruthers
//     ziptie may be freely distributed under the MIT License.

(function (global, nl) {
    'use strict';

    var ZIPTIE_ID_ATTR = '__ziptie_id__',
        ZIPTIE_ATTRIBUTES_NAME = '__ziptie_attributes__',
        nextId = 0,
        fasteners = {};

    var id = function (obj) {
        if (!obj) {
            return -1;
        }

        if (!obj.hasOwnProperty(ZIPTIE_ID_ATTR)) {
            /* Use defineProperty() to make the property non-enumerable */
            Object.defineProperty(obj, ZIPTIE_ID_ATTR, {
                value: ++nextId,
                configurable: true,
                /* Even those these values are default, be explicit. */
                writable: false,
                enumerable: false
            });
        }

        return obj[ZIPTIE_ID_ATTR];
    };

    var makeFastenerIndex = function (first, second) {
        var firstId = id(first),
            secondId = id(second);

        return (firstId < secondId ? firstId + ',' + secondId : secondId + ',' + firstId);
    };

    var hasEventListener = function (obj) {
        return (
            obj
            && typeof obj.addEventListener === 'function'
            && typeof obj.removeEventListener === 'function'
        );
    };

    var listen = function (obj, prop, fn) {
        if (!obj || hasEventListener(obj) || !obj.hasOwnProperty(prop)) {
            /* If obj doesn't exist, or already has listener functionality,
            or doesn't have a property prop, don't do anything. */
            return false;
        }

        var attributes = obj[ZIPTIE_ATTRIBUTES_NAME];
        if (typeof attributes === 'undefined') {
            /* Define ziptie attributes if it doesn't already exist. */
            Object.defineProperty(obj, ZIPTIE_ATTRIBUTES_NAME, {
                value: {},
                writable: true,
                configurable: true,
                enumerable: false
            });
        }

        var value = obj[prop];

        Object.defineProperty(obj, prop, {
            set: function (newValue) {
                obj[ZIPTIE_ATTRIBUTES_NAME][prop] = newValue;

                if (fn) {
                    fn(newValue, prop);
                }

                return obj[ZIPTIE_ATTRIBUTES_NAME][prop];
            },
            get: function () {
                return obj[ZIPTIE_ATTRIBUTES_NAME][prop];
            },
            configurable: true,
            enumerable: true
        });

        /* Return this half-fastener */
        return {
            obj: obj,
            pubfn: fn,
            property: prop
        };
    };

    var unlisten = function (obj, prop) {
        var attributes = obj[ZIPTIE_ATTRIBUTES_NAME];

        if (typeof attributes === 'undefined') {
            /* There are no ziptie attributes on this object. */
            return false;
        }

        var value = attributes[prop];

        /* Re-define the property as it originally existed. */
        Object.defineProperty(obj, prop, {
            value: value,
            enumerable: true,
            configurable: true
        });

        /* Remove the property from the ziptie attributes. */
        delete attributes[prop];

        /* If there are no more ziptie attributes, clean up after ourselves. */
        if (Object.keys(attributes).length === 0) {
            delete obj[ZIPTIE_ATTRIBUTES_NAME];
        }

        return true;
    };

    /* Define a fallback for addEventListener */
    var addInputListener = function ($el, fn) {
        /* What type of element is this? */
        var tag = $el.nodeName,
            type = $el.type,
            event = '',
            property = '';

        /* TODO: other exceptions? */
        if (tag === 'INPUT' && type && type.toLowerCase() === 'checkbox') {
            event = 'click';
            property = 'checked';
        } else if (tag === 'INPUT') {
            event = 'input';
            property = 'value';
        } else if (tag === 'TEXTAREA') {
            event = 'input';
            property = 'value';
        } else {
            event = null;
            property = 'innerHTML';
        }

        var callback = function (ev) {
            return fn($el[property], property, ev);
        };

        /* TODO: add copy/paste listener */
        $el.addEventListener(event, callback);

        /* Return the half-fastener */
        return {
            obj: $el,
            pubfn: callback,
            property: property,
            event: event
        };
    };

    var removeInputListener = function ($el, event, fn) {
        $el.removeEventListener(event, fn, false);
        return true;
    };

    var removePubSub = function (halfFastener) {
        if (!halfFastener) {
            /* No fastener defined */
            return false;
        }

        var success = false;

        if (hasEventListener(halfFastener.obj)) {
            success = removeInputListener(halfFastener.obj, halfFastener.event, halfFastener.pubfn);
        } else {
            success = unlisten(halfFastener.obj, halfFastener.property);
        }

        success = success && nl.unsub(halfFastener.channel, halfFastener.subfn);
        return success;
    };

    var createPublisher = function (obj, prop) {
        var publishCallback = function (val, propName) {
            nl.pub(id(obj) + '/' + propName + ':change', val);
        };

        var halfFastener,
            channelUri = id(obj) + '/';

        if (hasEventListener(obj)) {
            /* Ignore prop and add a listener to the DOM object */
            halfFastener = addInputListener(obj, publishCallback);

            channelUri += halfFastener.property;
        } else {
            halfFastener = listen(obj, prop, publishCallback);

            channelUri += prop;
        }

        channelUri += ':change';

        /* Add the channelUri to the half-fastener */
        halfFastener.channel = channelUri;

        /* Return the mutated half-fastener */
        return halfFastener;
    };

    var createSubscription = function (obj, prop, halfFastener) {
        var callback = function (val) {
            if (obj[prop] !== val) {
                obj[prop] = val;

                /* Fire the changed event with the new value if it's a DOM object and the onpropertychange is not in place */
                if (hasEventListener(obj)) {
                    nl.pub(id(obj) + '/' + prop + ':change', val);
                }
            }
        };

        nl.sub(halfFastener.channel, callback);

        halfFastener.subfn = callback;
        return halfFastener;
    };

    var fasten = function (first, firstProp, second, secondProp) {
        if (typeof firstProp !== 'string') {
            /* Not specifying a property on the first, shift everything */
            secondProp = second;
            second = firstProp;
            firstProp = void 0;
        }

        var firstHalf = createPublisher(first, firstProp);
        var secondHalf = createPublisher(second, secondProp);

        firstProp = firstHalf.property;
        secondProp = secondHalf.property;

        secondHalf = createSubscription(first, firstProp, secondHalf);
        firstHalf = createSubscription(second, secondProp, firstHalf);

        /* Store fastener */
        var index = makeFastenerIndex(first, second);

        fasteners[index] = {
            first: firstHalf,
            second: secondHalf
        };

        return true;
    };

    var snip = function (first, second) {
        var index = makeFastenerIndex(first, second),
            fastener = fasteners[index];

        if (!fastener) {
            /* No fastener exists - nothing to do */
            return false;
        }

        var firstHalf = fastener.first,
            secondHalf = fastener.second;

        removePubSub(firstHalf);
        removePubSub(secondHalf);

        delete fasteners[index];

        return true;
    };

    var ziptie = {
        fasteners: fasteners,
        fasten: fasten,
        snip: snip,
        createSubscription: createSubscription,
        createPublisher: createPublisher
    };

    if (typeof define === 'function' && define.amd) {
        // Export ziptie for CommonJS/AMD
        define('ziptie', ['newsletter'], function () {
            return ziptie;
        });
    } else if (typeof module !== 'undefined') {
        // Export ziptie for Node
        module.exports = ziptie;
    } else {
        // Define ziptie as a global.
        global.ziptie = ziptie;
    }

    return ziptie;
}(this, Newsletter));