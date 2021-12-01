// jss:
import { create as createJss, } from 'jss'; // base technology of our cssfn components
// custom jss-plugins:
import jssPluginGlobal from '@cssfn/jss-plugin-global';
import { default as jssPluginExtend, mergeStyle, } from '@cssfn/jss-plugin-extend';
import jssPluginNested from '@cssfn/jss-plugin-nested';
import jssPluginShort from '@cssfn/jss-plugin-short';
import jssPluginCamelCase from '@cssfn/jss-plugin-camel-case';
import jssPluginVendor from '@cssfn/jss-plugin-vendor';
// others libs:
import { pascalCase } from 'pascal-case'; // pascal-case support for jss
import { camelCase } from 'camel-case'; // camel-case  support for jss
import warning from 'tiny-warning';
// jss:
const createGenerateId = (options = {}) => {
    let idCounter = 0;
    const maxCounter = 1e10;
    return (rule, sheet) => {
        idCounter++;
        if (idCounter > maxCounter)
            warning(false, `[JSS] You might have a memory leak. ID counter is at ${idCounter}.`);
        const prefix = sheet?.options?.classNamePrefix || 'c';
        return `${prefix}${idCounter}`;
    };
};
const customJss = createJss().setup({ createGenerateId, plugins: [
        jssPluginGlobal(),
        jssPluginExtend(),
        jssPluginNested(),
        jssPluginShort(),
        jssPluginCamelCase(),
        jssPluginVendor(),
    ] });
// styles:
export const createJssSheet = (styles) => {
    return customJss.createStyleSheet(((typeof (styles) === 'function') ? styles() : styles));
};
export const createSheet = (classes) => {
    return createJssSheet(() => usesCssfn(classes));
};
// cssfn hooks:
export const usesCssfn = (classes) => {
    return (mergeStyles(((typeof (classes) === 'function') ? classes() : classes)
        /*
            empty `className` recognized as `@global` in our `jss-plugin-global`
            but to make more compatible with JSS' official `jss-plugin-global`
            we convert empty `className` to `'@global'`
         */
        .map(([className, styles]) => ({ [className || '@global']: mergeStyles(styles) })) // convert each `[className, styles]` to `{ className : mergeStyles(styles) | null }`
    ) ?? {});
};
// compositions:
/**
 * Defines the (sub) component's composition.
 * @returns A `StyleCollection` represents the (sub) component's composition.
 */
export const composition = (styles) => styles;
/**
 * Merges the (sub) component's composition to single `Style`.
 * @returns A `Style` represents the merged (sub) component's composition
 * -or-
 * `null` represents an empty `Style`.
 */
export const mergeStyles = (styles) => {
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
                mergeStyles(subStyles) // an array => ProductOrFactoryDeepArray<OptionalOrFalse<Style>> => recursively `mergeStyles()`
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
        mergeStyle(mergedStyles, subStyleValue);
    } // for
    if (Object.keys(mergedStyles).length === 0)
        return null; // an empty object => return `null`
    return mergedStyles;
};
/**
 * Defines the additional component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export const compositionOf = (className, styles) => [
    className,
    styles
];
// shortcut compositions:
/**
 * Defines the main component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export const mainComposition = (styles) => compositionOf('main', styles);
/**
 * Defines the global style applied to a whole document.
 * @returns A `ClassEntry` represents the global style.
 */
export const globalDef = (ruleCollection) => compositionOf('', [rules(ruleCollection)]);
export const imports = (styles) => composition(styles);
// layouts:
/**
 * Defines component's layout.
 * @returns A `Style` represents the component's layout.
 */
export const layout = (style) => style;
/**
 * Defines component's variable(s).
 * @returns A `Style` represents the component's variable(s).
 */
export const vars = (items) => items;
const defaultCombinatorOptions = {
    groupSelectors: true,
};
export const combinators = (combinator, selectors, styles, options = defaultCombinatorOptions) => {
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
    const mergedStyles = mergeStyles(styles); // merge the `styles` to single `Style`, for making JSS understand
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
export const descendants = (selectors, styles, options = defaultCombinatorOptions) => combinators(' ', selectors, styles, options);
export const children = (selectors, styles, options = defaultCombinatorOptions) => combinators('>', selectors, styles, options);
export const siblings = (selectors, styles, options = defaultCombinatorOptions) => combinators('~', selectors, styles, options);
export const nextSiblings = (selectors, styles, options = defaultCombinatorOptions) => combinators('+', selectors, styles, options);
const defaultRuleOptions = {
    minSpecificityWeight: 0,
};
export const rules = (ruleCollection, options = defaultRuleOptions) => {
    const { minSpecificityWeight = defaultRuleOptions.minSpecificityWeight, } = options;
    return composition((() => {
        const noSelectors = [];
        return [
            ...(Array.isArray(ruleCollection) ? ruleCollection : [ruleCollection])
                .flatMap((ruleEntrySourceList) => {
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
                mergeStyles(styles) // merge the `styles` to single `Style`, for making JSS understand
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
// shortcut rules:
/**
 * Defines component's variants.
 * @returns A `StyleCollection` represents the component's variants.
 */
export const variants = (variants, options = defaultRuleOptions) => rules(variants, options);
/**
 * Defines component's states.
 * @param inherit `true` to inherit states from parent element -or- `false` to create independent states.
 * @returns A `StyleCollection` represents the component's states.
 */
export const states = (states, inherit = false, options = { ...defaultRuleOptions, minSpecificityWeight: 3 }) => {
    return rules((typeof (states) === 'function') ? states(inherit) : states, options);
};
// rule items:
/**
 * Defines component's `style(s)` that is applied when the specified `selector(s)` meet the conditions.
 * @returns A `RuleEntry` represents the component's rule.
 */
export const rule = (selectors, styles) => [selectors, styles];
// shortcut rule items:
export const noRule = (styles) => rule('&', styles);
export const emptyRule = () => rule(null, null);
export const atRoot = (styles) => rule(':root', styles);
export const atGlobal = (styles) => rule('@global', styles);
export const fontFace = (styles) => atGlobal(rules([
    rule('@font-face', styles),
]));
export const isFirstChild = (styles) => rule(':first-child', styles);
export const isNotFirstChild = (styles) => rule(':not(:first-child)', styles);
export const isLastChild = (styles) => rule(':last-child', styles);
export const isNotLastChild = (styles) => rule(':not(:last-child)', styles);
export const isNthChild = (step, offset, styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return emptyRule(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return isFirstChild(styles);
        return rule(`:nth-child(${offset})`, styles);
    }
    else if (step === 1) { // 1 step
        return rule(`:nth-child(n+${offset})`, styles);
    }
    else { // 2+ steps
        return rule(`:nth-child(${step}n+${offset})`, styles);
    } // if
};
export const isNotNthChild = (step, offset, styles) => {
    if (step === 0) { // no step
        // if (offset === 0) return emptyRule(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return isNotFirstChild(styles);
        return rule(`:not(:nth-child(${offset}))`, styles);
    }
    else if (step === 1) { // 1 step
        return rule(`:not(:nth-child(n+${offset}))`, styles);
    }
    else { // 2+ steps
        return rule(`:not(:nth-child(${step}n+${offset}))`, styles);
    } // if
};
export const isNthLastChild = (step, offset, styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return emptyRule(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return isLastChild(styles);
        return rule(`:nth-last-child(${offset})`, styles);
    }
    else if (step === 1) { // 1 step
        return rule(`:nth-last-child(n+${offset})`, styles);
    }
    else { // 2+ steps
        return rule(`:nth-last-child(${step}n+${offset})`, styles);
    } // if
};
export const isNotNthLastChild = (step, offset, styles) => {
    if (step === 0) { // no step
        // if (offset === 0) return emptyRule(); // element indices are starting from 1 => never match => return empty style
        if (offset === 1)
            return isNotLastChild(styles);
        return rule(`:not(:nth-last-child(${offset}))`, styles);
    }
    else if (step === 1) { // 1 step
        return rule(`:not(:nth-last-child(n+${offset}))`, styles);
    }
    else { // 2+ steps
        return rule(`:not(:nth-last-child(${step}n+${offset}))`, styles);
    } // if
};
export const isActive = (styles) => rule(':active', styles);
export const isNotActive = (styles) => rule(':not(:active)', styles);
export const isFocus = (styles) => rule(':focus', styles);
export const isNotFocus = (styles) => rule(':not(:focus)', styles);
export const isFocusVisible = (styles) => rule(':focus-visible', styles);
export const isNotFocusVisible = (styles) => rule(':not(:focus-visible)', styles);
export const isHover = (styles) => rule(':hover', styles);
export const isNotHover = (styles) => rule(':not(:hover)', styles);
export const isEmpty = (styles) => rule(':empty', styles);
export const isNotEmpty = (styles) => rule(':not(:empty)', styles);
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
export const iif = (condition, content) => {
    return condition ? content : {};
};
/**
 * Escapes some sets of character in svg data, so it will be valid to be written in css.
 * @param svgData The raw svg data to be escaped.
 * @returns A `string` represents an escaped svg data.
 */
export const escapeSvg = (svgData) => {
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
/**
 * Creates a single layer solid background based on specified `color`.
 * @param color The color of the solid background to create.
 * @returns A `Cust.Expr` represents a solid background.
 */
export const solidBackg = (color, clip = 'border-box') => {
    return [[`linear-gradient(${color},${color})`, clip]];
};
export { pascalCase, camelCase };
