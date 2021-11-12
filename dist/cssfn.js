"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelCase = exports.pascalCase = exports.solidBackg = exports.escapeSvg = exports.iif = exports.isNotEmpty = exports.isEmpty = exports.isNotHover = exports.isHover = exports.isNotFocusVisible = exports.isFocusVisible = exports.isNotFocus = exports.isFocus = exports.isNotActive = exports.isActive = exports.isNotNthLastChild = exports.isNthLastChild = exports.isNotNthChild = exports.isNthChild = exports.isNotLastChild = exports.isLastChild = exports.isNotFirstChild = exports.isFirstChild = exports.fontFace = exports.atGlobal = exports.atRoot = exports.emptyRule = exports.noRule = exports.rule = exports.states = exports.variants = exports.rules = exports.adjacentSiblings = exports.siblings = exports.children = exports.descendants = exports.combinators = exports.vars = exports.layout = exports.imports = exports.global = exports.mainComposition = exports.compositionOf = exports.mergeStyles = exports.composition = exports.usesCssfn = exports.createSheet = exports.createJssSheet = void 0;
// jss:
const jss_1 = require("jss"); // base technology of our cssfn components
// official jss-plugins:
const jss_plugin_nested_1 = __importDefault(require("jss-plugin-nested"));
const jss_plugin_camel_case_1 = __importDefault(require("jss-plugin-camel-case"));
const jss_plugin_expand_1 = __importDefault(require("jss-plugin-expand"));
const jss_plugin_vendor_prefixer_1 = __importDefault(require("jss-plugin-vendor-prefixer"));
// custom jss-plugins:
const jss_plugin_global_1 = __importDefault(require("@cssfn/jss-plugin-global"));
const jss_plugin_extend_1 = __importStar(require("@cssfn/jss-plugin-extend"));
const jss_plugin_short_1 = __importDefault(require("@cssfn/jss-plugin-short"));
// others libs:
const pascal_case_1 = require("pascal-case"); // pascal-case support for jss
Object.defineProperty(exports, "pascalCase", { enumerable: true, get: function () { return pascal_case_1.pascalCase; } });
const camel_case_1 = require("camel-case"); // camel-case  support for jss
Object.defineProperty(exports, "camelCase", { enumerable: true, get: function () { return camel_case_1.camelCase; } });
const tiny_warning_1 = __importDefault(require("tiny-warning"));
// jss:
const createGenerateId = (options = {}) => {
    let idCounter = 0;
    const maxCounter = 1e10;
    return (rule, sheet) => {
        idCounter++;
        if (idCounter > maxCounter)
            (0, tiny_warning_1.default)(false, `[JSS] You might have a memory leak. ID counter is at ${idCounter}.`);
        const prefix = sheet?.options?.classNamePrefix || 'c';
        return `${prefix}${idCounter}`;
    };
};
const customJss = (0, jss_1.create)().setup({ createGenerateId, plugins: [
        (0, jss_plugin_global_1.default)(),
        (0, jss_plugin_extend_1.default)(),
        (0, jss_plugin_nested_1.default)(),
        (0, jss_plugin_short_1.default)(),
        (0, jss_plugin_camel_case_1.default)(),
        (0, jss_plugin_expand_1.default)(),
        (0, jss_plugin_vendor_prefixer_1.default)(),
    ] });
// styles:
const createJssSheet = (styles) => {
    return customJss.createStyleSheet(((typeof (styles) === 'function') ? styles() : styles));
};
exports.createJssSheet = createJssSheet;
const createSheet = (classes) => {
    return (0, exports.createJssSheet)(() => (0, exports.usesCssfn)(classes));
};
exports.createSheet = createSheet;
// cssfn hooks:
const usesCssfn = (classes) => {
    return ((0, exports.mergeStyles)(((typeof (classes) === 'function') ? classes() : classes)
        /*
            empty `className` recognized as `@global` in our `jss-plugin-global`
            but to make more compatible with JSS' official `jss-plugin-global`
            we convert empty `className` to `'@global'`
         */
        .map(([className, styles]) => ({ [className || '@global']: (0, exports.mergeStyles)(styles) })) // convert each `[className, styles]` to `{ className : mergeStyles(styles) | null }`
    ) ?? {});
};
exports.usesCssfn = usesCssfn;
// compositions:
/**
 * Defines the (sub) component's composition.
 * @returns A `StyleCollection` represents the (sub) component's composition.
 */
const composition = (styles) => styles;
exports.composition = composition;
/**
 * Merges the (sub) component's composition to single `Style`.
 * @returns A `Style` represents the merged (sub) component's composition
 * -or-
 * `null` represents an empty `Style`.
 */
const mergeStyles = (styles) => {
    /*
        StyleCollection = ProductOrFactoryOrDeepArray<OptionalOrFalse<Style>>
        StyleCollection = ProductOrFactory<OptionalOrFalse<Style>> | ProductOrFactoryDeepArray<OptionalOrFalse<Style>>
        typeof          = ------------- not an array ------------- | ----------------- is an array ------------------
    */
    if (!Array.isArray(styles)) {
        // not an array => ProductOrFactory<OptionalOrFalse<Style>>
        const styleValue = ((typeof (styles) === 'function')
            ?
                styles() // a function => Factory<OptionalOrFalse<Style>>
            :
                styles // a product  => OptionalOrFalse<Style>
        );
        if (!styleValue)
            return null; // `null` or `undefined` => return `null`
        return styleValue;
    } // if
    const mergedStyles = {};
    for (const subStyles of styles) {
        const subStyleValue = (Array.isArray(subStyles)
            ?
                (0, exports.mergeStyles)(subStyles) // an array => ProductOrFactoryDeepArray<OptionalOrFalse<Style>> => recursively `mergeStyles()`
            :
                (
                // not an array => ProductOrFactory<OptionalOrFalse<Style>>
                (typeof (subStyles) === 'function')
                    ?
                        subStyles() // a function => Factory<OptionalOrFalse<Style>>
                    :
                        subStyles // a product  => OptionalOrFalse<Style>
                ));
        if (!subStyleValue)
            continue; // `null` or `undefined` => skip
        (0, jss_plugin_extend_1.mergeStyle)(mergedStyles, subStyleValue);
    } // for
    if (Object.keys(mergedStyles).length === 0)
        return null; // an empty object => return `null`
    return mergedStyles;
};
exports.mergeStyles = mergeStyles;
/**
 * Defines the additional component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
const compositionOf = (className, styles) => [
    className,
    styles
];
exports.compositionOf = compositionOf;
// shortcut compositions:
/**
 * Defines the main component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
const mainComposition = (styles) => (0, exports.compositionOf)('main', styles);
exports.mainComposition = mainComposition;
/**
 * Defines the global style applied to a whole document.
 * @returns A `ClassEntry` represents the global style.
 */
const global = (ruleCollection) => (0, exports.compositionOf)('', [(0, exports.rules)(ruleCollection)]);
exports.global = global;
const imports = (styles) => (0, exports.composition)(styles);
exports.imports = imports;
// layouts:
/**
 * Defines component's layout.
 * @returns A `Style` represents the component's layout.
 */
const layout = (style) => style;
exports.layout = layout;
/**
 * Defines component's variable(s).
 * @returns A `Style` represents the component's variable(s).
 */
const vars = (items) => items;
exports.vars = vars;
const defaultCombinatorOptions = {
    groupSelectors: true,
};
const combinators = (combinator, selectors, styles, options = defaultCombinatorOptions) => {
    const { groupSelectors = defaultCombinatorOptions.groupSelectors, } = options;
    const combiSelectors = flat(selectors).map((selector) => {
        if (!selector)
            selector = '*'; // empty selector => match any element
        // if (selector === '&') return selector; // no children => the parent itself
        if (selector.includes('&'))
            return selector; // custom combinator
        if (((combinator === ' ') || (combinator === '>')) && selector.startsWith('::'))
            return `&${selector}`; // pseudo element => attach the parent itself (for descendants & children)
        return `&${combinator}${selector}`;
    });
    if (!combiSelectors.length)
        return {}; // no selector => return empty
    const mergedStyles = (0, exports.mergeStyles)(styles); // merge the `styles` to single `Style`, for making JSS understand
    if (!mergedStyles)
        return {}; // no style => return empty
    if (groupSelectors) {
        return {
            [combiSelectors.join(',')]: mergedStyles,
        };
    }
    else {
        return Object.fromEntries(combiSelectors
            .map((combiSelector) => [combiSelector, mergedStyles]));
    } // if
};
exports.combinators = combinators;
const descendants = (selectors, styles, options = defaultCombinatorOptions) => (0, exports.combinators)(' ', selectors, styles, options);
exports.descendants = descendants;
const children = (selectors, styles, options = defaultCombinatorOptions) => (0, exports.combinators)('>', selectors, styles, options);
exports.children = children;
const siblings = (selectors, styles, options = defaultCombinatorOptions) => (0, exports.combinators)('~', selectors, styles, options);
exports.siblings = siblings;
const adjacentSiblings = (selectors, styles, options = defaultCombinatorOptions) => (0, exports.combinators)('+', selectors, styles, options);
exports.adjacentSiblings = adjacentSiblings;
const defaultRuleOptions = {
    minSpecificityWeight: 0,
};
const rules = (ruleCollection, options = defaultRuleOptions) => {
    const { minSpecificityWeight = defaultRuleOptions.minSpecificityWeight, } = options;
    return (0, exports.composition)((() => {
        const noSelectors = [];
        return [
            ...(Array.isArray(ruleCollection) ? ruleCollection : [ruleCollection])
                .map((ruleEntrySourceList) => {
                const isOptionalString = (value) => {
                    if (value === null)
                        return true; // optional `null`
                    if (value === undefined)
                        return true; // optional `undefined`
                    if (value === false)
                        return true; // optional `false`
                    return ((typeof value) === 'string');
                };
                const isOptionalStringDeepArr = (value) => {
                    if (!Array.isArray(value))
                        return false;
                    const nonOptionalStringItems = value.filter((v) => !isOptionalString(v));
                    if (nonOptionalStringItems.length === 0)
                        return true;
                    for (const nonOptionalStringItem of nonOptionalStringItems) {
                        if (!isOptionalStringDeepArr(nonOptionalStringItem))
                            return false;
                    } // for
                    return true;
                };
                const isOptionalSelector = (value) => isOptionalString(value);
                const isOptionalSelectorDeepArr = (value) => isOptionalStringDeepArr(value);
                const isOptionalStyleOrFactory = (value) => {
                    if (value === null)
                        return true; // optional `null`
                    if (value === undefined)
                        return true; // optional `undefined`
                    return (value
                        &&
                            (((typeof (value) === 'object') && !Array.isArray(value)) // literal object => `Style`
                                ||
                                    (typeof (value) === 'function') // function => `Factory<Style>`
                            ));
                };
                const isOptionalStyleOrFactoryDeepArr = (value) => {
                    if (!Array.isArray(value))
                        return false;
                    const nonStyleOrFactoryItems = value.filter((v) => !isOptionalStyleOrFactory(v));
                    if (nonStyleOrFactoryItems.length === 0)
                        return true;
                    for (const nonStyleOrFactoryItem of nonStyleOrFactoryItems) {
                        if (!isOptionalStyleOrFactoryDeepArr(nonStyleOrFactoryItem))
                            return false;
                    } // for
                    return true;
                };
                const isOptionalRuleEntry = (value) => {
                    if (value === null)
                        return true; // optional `null`
                    if (value === undefined)
                        return true; // optional `undefined`
                    if (value === false)
                        return true; // optional `false`
                    if (value.length !== 2)
                        return false; // not a tuple => not a `RuleEntry`
                    const [first, second] = value;
                    /*
                        the first element must be `SelectorCollection`:
                        * `OptionalOrFalse<Selector>`
                        * DeepArrayOf< `OptionalOrFalse<Selector>` >
                        * empty array
                    */
                    // and
                    /*
                        the second element must be `StyleCollection`:
                        * `OptionalOrFalse<Style>` | `Factory<OptionalOrFalse<Style>>`
                        * DeepArrayOf< `OptionalOrFalse<Style> | Factory<OptionalOrFalse<Style>>` >
                        * empty array
                    */
                    return ((isOptionalSelector(first)
                        ||
                            isOptionalSelectorDeepArr(first))
                        &&
                            (isOptionalStyleOrFactory(second)
                                ||
                                    isOptionalStyleOrFactoryDeepArr(second)));
                };
                if (typeof (ruleEntrySourceList) === 'function')
                    return [ruleEntrySourceList()];
                if (isOptionalRuleEntry(ruleEntrySourceList))
                    return [ruleEntrySourceList];
                return ruleEntrySourceList.map((ruleEntrySource) => (typeof (ruleEntrySource) === 'function') ? ruleEntrySource() : ruleEntrySource);
            })
                .flat(/*depth: */ 1) // flatten: OptionalOrFalse<RuleEntry>[][] => OptionalOrFalse<RuleEntry>[]
                .filter((optionalRuleEntry) => !!optionalRuleEntry)
                .map(([selectors, styles]) => {
                let nestedSelectors = flat(selectors).filter((selector) => !!selector).map((selector) => {
                    if (selector.startsWith('@'))
                        return selector; // for `@media`
                    if (selector.includes('&'))
                        return selector; // &.foo   .boo&   .foo&.boo
                    // if (selector.startsWith('.') || selector.startsWith(':') || selector.startsWith('#') || (selector === '*')) return `&${selector}`;
                    return `&${selector}`;
                });
                if (minSpecificityWeight >= 2) {
                    nestedSelectors = nestedSelectors.map((nestedSelector) => {
                        if (nestedSelector === '&')
                            return nestedSelector; // zero specificity => no change
                        // one/more specificities found => increase the specificity weight until reaches `minSpecificityWeight`
                        // calculate the specificity weight:
                        // `.realClassName` or `:pseudoClassName` (without parameters):
                        const classes = nestedSelector.match(/(\.|:(?!(is|not)(?![\w-])))[\w-]+/gmi); // count the `.RealClass` and `:PseudoClass` but not `:is` or `:not`
                        const specificityWeight = classes?.length ?? 0;
                        const missSpecificityWeight = minSpecificityWeight - specificityWeight;
                        // the specificity weight was meet the minimum specificity required => no change:
                        if (missSpecificityWeight <= 0)
                            return nestedSelector;
                        // the specificity weight is less than the minimum specificity required => increase the specificity:
                        return `${nestedSelector}${(new Array(missSpecificityWeight)).fill((() => {
                            const lastClass = classes?.[classes.length - 1];
                            if (lastClass) {
                                // the last word (without parameters):
                                if (nestedSelector.length === (nestedSelector.lastIndexOf(lastClass) + lastClass.length))
                                    return lastClass; // `.RealClass` or `:PseudoClass` without parameters
                            } // if
                            // use a **hacky class name** to increase the specificity:
                            return ':not(._)';
                        })()).join('')}`;
                    });
                } // if
                if (nestedSelectors.includes('&')) { // contains one/more selectors with zero specificity
                    nestedSelectors = nestedSelectors.filter((nestedSelector) => (nestedSelector !== '&')); // filter out selectors with zero specificity
                    noSelectors.push(styles); // add styles with zero specificity
                } // if
                return [nestedSelectors, styles];
            })
                .filter(([nestedSelectors]) => (nestedSelectors.length > 0)) // filter out empty `nestedSelectors`
                .map(([nestedSelectors, styles]) => [
                nestedSelectors,
                (0, exports.mergeStyles)(styles) // merge the `styles` to single `Style`, for making JSS understand
            ])
                .filter((tuple) => !!tuple[1]) // filter out empty `mergedStyles`
                .map(([nestedSelectors, mergedStyles]) => {
                return {
                    [nestedSelectors.join(',')]: mergedStyles,
                };
            }),
            ...noSelectors,
        ];
    })());
};
exports.rules = rules;
// shortcut rules:
/**
 * Defines component's variants.
 * @returns A `StyleCollection` represents the component's variants.
 */
const variants = (variants, options = defaultRuleOptions) => (0, exports.rules)(variants, options);
exports.variants = variants;
/**
 * Defines component's states.
 * @param inherit `true` to inherit states from parent element -or- `false` to create independent states.
 * @returns A `StyleCollection` represents the component's states.
 */
const states = (states, inherit = false, options = { ...defaultRuleOptions, minSpecificityWeight: 3 }) => {
    return (0, exports.rules)((typeof (states) === 'function') ? states(inherit) : states, options);
};
exports.states = states;
// rule items:
/**
 * Defines component's `style(s)` that is applied when the specified `selector(s)` meet the conditions.
 * @returns A `RuleEntry` represents the component's rule.
 */
const rule = (selectors, styles) => [selectors, styles];
exports.rule = rule;
// shortcut rule items:
const noRule = (styles) => (0, exports.rule)('&', styles);
exports.noRule = noRule;
const emptyRule = () => (0, exports.rule)(null, null);
exports.emptyRule = emptyRule;
const atRoot = (styles) => (0, exports.rule)(':root', styles);
exports.atRoot = atRoot;
const atGlobal = (styles) => (0, exports.rule)('@global', styles);
exports.atGlobal = atGlobal;
const fontFace = (styles) => (0, exports.atGlobal)((0, exports.rules)([
    (0, exports.rule)('@font-face', styles),
]));
exports.fontFace = fontFace;
const isFirstChild = (styles) => (0, exports.rule)(':first-child', styles);
exports.isFirstChild = isFirstChild;
const isNotFirstChild = (styles) => (0, exports.rule)(':not(:first-child)', styles);
exports.isNotFirstChild = isNotFirstChild;
const isLastChild = (styles) => (0, exports.rule)(':last-child', styles);
exports.isLastChild = isLastChild;
const isNotLastChild = (styles) => (0, exports.rule)(':not(:last-child)', styles);
exports.isNotLastChild = isNotLastChild;
const isNthChild = (step, offset, styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return (0, exports.emptyRule)(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return (0, exports.isFirstChild)(styles);
        return (0, exports.rule)(`:nth-child(${offset})`, styles);
    }
    else if (step === 1) { // 1 step
        return (0, exports.rule)(`:nth-child(n+${offset})`, styles);
    }
    else { // 2+ steps
        return (0, exports.rule)(`:nth-child(${step}n+${offset})`, styles);
    } // if
};
exports.isNthChild = isNthChild;
const isNotNthChild = (step, offset, styles) => {
    if (step === 0) { // no step
        // if (offset === 0) return emptyRule(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return (0, exports.isNotFirstChild)(styles);
        return (0, exports.rule)(`:not(:nth-child(${offset}))`, styles);
    }
    else if (step === 1) { // 1 step
        return (0, exports.rule)(`:not(:nth-child(n+${offset}))`, styles);
    }
    else { // 2+ steps
        return (0, exports.rule)(`:not(:nth-child(${step}n+${offset}))`, styles);
    } // if
};
exports.isNotNthChild = isNotNthChild;
const isNthLastChild = (step, offset, styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return (0, exports.emptyRule)(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return (0, exports.isLastChild)(styles);
        return (0, exports.rule)(`:nth-last-child(${offset})`, styles);
    }
    else if (step === 1) { // 1 step
        return (0, exports.rule)(`:nth-last-child(n+${offset})`, styles);
    }
    else { // 2+ steps
        return (0, exports.rule)(`:nth-last-child(${step}n+${offset})`, styles);
    } // if
};
exports.isNthLastChild = isNthLastChild;
const isNotNthLastChild = (step, offset, styles) => {
    if (step === 0) { // no step
        // if (offset === 0) return emptyRule(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return (0, exports.isNotLastChild)(styles);
        return (0, exports.rule)(`:not(:nth-last-child(${offset}))`, styles);
    }
    else if (step === 1) { // 1 step
        return (0, exports.rule)(`:not(:nth-last-child(n+${offset}))`, styles);
    }
    else { // 2+ steps
        return (0, exports.rule)(`:not(:nth-last-child(${step}n+${offset}))`, styles);
    } // if
};
exports.isNotNthLastChild = isNotNthLastChild;
const isActive = (styles) => (0, exports.rule)(':active', styles);
exports.isActive = isActive;
const isNotActive = (styles) => (0, exports.rule)(':not(:active)', styles);
exports.isNotActive = isNotActive;
const isFocus = (styles) => (0, exports.rule)(':focus', styles);
exports.isFocus = isFocus;
const isNotFocus = (styles) => (0, exports.rule)(':not(:focus)', styles);
exports.isNotFocus = isNotFocus;
const isFocusVisible = (styles) => (0, exports.rule)(':focus-visible', styles);
exports.isFocusVisible = isFocusVisible;
const isNotFocusVisible = (styles) => (0, exports.rule)(':not(:focus-visible)', styles);
exports.isNotFocusVisible = isNotFocusVisible;
const isHover = (styles) => (0, exports.rule)(':hover', styles);
exports.isHover = isHover;
const isNotHover = (styles) => (0, exports.rule)(':not(:hover)', styles);
exports.isNotHover = isNotHover;
const isEmpty = (styles) => (0, exports.rule)(':empty', styles);
exports.isEmpty = isEmpty;
const isNotEmpty = (styles) => (0, exports.rule)(':not(:empty)', styles);
exports.isNotEmpty = isNotEmpty;
// utilities:
/**
 * Returns a new array with all sub-array elements concatenated into it recursively up to infinity depth.
 * @param collection An element -or- an array of element -or- a recursive array of element
 * @returns A new array with all sub-array elements concatenated into it.
 */
const flat = (collection) => {
    /*
        SingleOrDeepArray<T> =       T      | DeepArray<T>
        typeof               = not an array | is an array
    */
    if (!Array.isArray(collection)) {
        // not an array => T
        return [collection];
    } // if
    const merged = [];
    for (const item of collection) {
        if (Array.isArray(item)) {
            // an array => DeepArray<T> => recursively `flat()`
            merged.push(...flat(item));
        }
        else {
            // not an array => T
            merged.push(item);
        } // if
    } // for
    return merged;
};
const iif = (condition, content) => {
    return condition ? content : {};
};
exports.iif = iif;
/**
 * Escapes some sets of character in svg data, so it will be valid to be written in css.
 * @param svgData The raw svg data to be escaped.
 * @returns A `string` represents an escaped svg data.
 */
const escapeSvg = (svgData) => {
    const escapedChars = {
        '<': '%3c',
        '>': '%3e',
        '#': '%23',
        '(': '%28',
        ')': '%29',
    };
    const svgDataCopy = Array.from(svgData);
    for (const index in svgDataCopy) {
        const char = svgDataCopy[index];
        if (char in escapedChars)
            svgDataCopy[index] = escapedChars[char];
    }
    return svgDataCopy.join('');
};
exports.escapeSvg = escapeSvg;
/**
 * Creates a single layer solid background based on specified `color`.
 * @param color The color of the solid background to create.
 * @returns A `Cust.Expr` represents a solid background.
 */
const solidBackg = (color, clip = 'border-box') => {
    return [[`linear-gradient(${color},${color})`, clip]];
};
exports.solidBackg = solidBackg;
