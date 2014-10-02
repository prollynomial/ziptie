//     ziptie.js - (c) 2014 Adam Carruthers
//     ziptie may be freely distributed under the MIT License.

(function (global) {
    'use strict';

    var ZIPTIE_ATTRIBUTES = '__ziptie_attributes__';

    modulify(function () {
        /**
         * Options looks like:
         *
         *  {
         *      view: {
         *          target: $('#name'),
         *          event: 'input',
         *          property: 'value'
         *      },
         *      model: {
         *          target: myObj,
         *          property: 'name'
         *      }
         *  }
         */
        function Ziptie(options) {
            /* Verify input: */
            if (!options.model || !options.view) {
                throw new Error('Invalid options: missing view or model.');
            }

            this.options = options;
            var model = options.model,
                view = options.view;

            this.viewChangedCallback = function () {
                /* Get the new view value: */
                var value = view.target[view.property];

                /* Sync the model: */
                model.target[model.property] = value;
            }

            this.modelChangedCallback = function () {
                /* Get the new model value: */
                var value = model.target[model.property];

                /* Sync the view: */
                view.target[view.property] = value;
            }

            /* Fasten the targets. */
            configureModel(options.model, this.modelChangedCallback);
            configureView(options.view, this.viewChangedCallback);

            /* Sync model and view, taking model as truth: */
            this.modelChangedCallback();
        }

        extend(Ziptie.prototype, {
            snip: function () {
                /* Unregister view callback. */
                teardownView(this.options.view, this.viewChangedCallback);

                /* Remove model observer. */
                teardownModel(this.options.model);
            }
        });

        return Ziptie;
    });

    /* Utility function - TODO: replace with lodash.assign */
    function extend(object, source) {
        var index = -1,
            props = Object.keys(source),
            length = props.length;

        while (++index < length) {
            var key = props[index];
            object[key] = source[key];
        }

        return object;
    }

    function configureView(view, viewChangedCallback) {
        /* Verify input: */
        if (!view.target || !view.event || !view.property) {
            return false;
        }

        /* Add the event listener. */
        view.target.addEventListener(view.event, viewChangedCallback);
    }

    function configureModel(model, modelChangedCallback) {
        /* Verify input: */
        if (!model.target || !model.property) {
            return false;
        }

        observe(model, modelChangedCallback);
    }

    function teardownModel(model) {
        removeObserver(model);
    }

    function teardownView(view, viewChangedCallback) {
        /* Remove the event listener: */
        view.target.removeEventListener(view.event, viewChangedCallback);
    }

    function observe(model, callback) {
        var attributes = getZiptieAttributes(model.target);

        /* Back up the value of the property. */
        attributes[model.property] = model.target[model.property];

        /* Redefine target.property to support observation: */
        Object.defineProperty(model.target, model.property, {
            set: function (newValue) {
                attributes[model.property] = newValue;

                callback(newValue);

                return attributes[model.property];
            },

            get: function () {
                return attributes[model.property];
            },

            configurable: true,
            enumerable: true
        });
    }

    function removeObserver(model) {
        var attributes = getZiptieAttributes(model.target),
            value = attributes[model.property];

        /* Re-define the property as it originally existed. */
        Object.defineProperty(model.target, model.property, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });

        /* Remove the property from the ziptie attributes. */
        delete attributes[model.property];

        return true;
    }

    function getZiptieAttributes(target) {
        var attributes = target[ZIPTIE_ATTRIBUTES];

        if (typeof attributes === 'undefined') {
            /* Define ziptie attributes if it doesn't already exist. */
            attributes = createZiptieAttributes(target);
        }

        return attributes;
    }

    function createZiptieAttributes(target) {
        Object.defineProperty(target, ZIPTIE_ATTRIBUTES, {
                value: {},
                writable: true,
                configurable: true,
                enumerable: false
            });

        return target[ZIPTIE_ATTRIBUTES];
    }

    /* Exports Ziptie for a subset of the plethora of module systems. */
    function modulify(factory) {
        if (typeof module === 'object') {
            /* Export for Browserify: */
            module.exports = factory();
        } else if (typeof define === 'function' && define.amd) {
            /* Export for amd: */
            define('ziptie', factory);
        } else {
            /* Extend the global scope to include ziptie: */
            global.Ziptie = factory();
        }
    }
}(window));
