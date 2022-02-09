// jss:
import { create as createJss, } from 'jss'; // base technology of our cssfn components
// custom jss-plugins:
import jssPluginNested from '@cssfn/jss-plugin-nested';
import jssPluginShort from '@cssfn/jss-plugin-short';
import jssPluginCamelCase from '@cssfn/jss-plugin-camel-case';
import jssPluginVendor from '@cssfn/jss-plugin-vendor';
import { 
// parses:
parseSelectors, 
// creates & tests:
parentSelector, pseudoClassSelector, isSimpleSelector, isParentSelector, isClassOrPseudoClassSelector, isPseudoElementSelector, isNotPseudoElementSelector, isCombinator, createSelector, createSelectorList, isNotEmptySelectorEntry, isNotEmptySelector, isNotEmptySelectors, 
// renders:
selectorsToString, 
// transforms:
groupSelectors, groupSelector, ungroupSelector, 
// measures:
calculateSpecificity, } from '@cssfn/css-selector';
import { pascalCase } from 'pascal-case'; // pascal-case support for jss
import { camelCase } from 'camel-case'; // camel-case  support for jss
import warning from 'tiny-warning';
// utilities:
const fastHash = (input) => {
    let hash = 0, i, chr;
    for (i = 0; i < input.length; i++) {
        chr = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    } // for
    hash = Math.abs(hash);
    return hash.toString(36).slice(-5); // get the last 5 characters
};
// jss:
const createGenerateId = (options = {}) => {
    const takenHashes = new Map();
    return (rule, sheet) => {
        const globalID = (() => {
            let sheetId = sheet?.options?.sheetId ?? sheet?.options?.index ?? '';
            if (typeof (sheetId) !== 'string') {
                sheetId = (sheetId ? fastHash(JSON.stringify(sheetId)) : '');
                if (sheet) {
                    if (!sheet.options)
                        sheet.options = {};
                    sheet.options.sheetId = sheetId;
                } // if
            } // if
            const classId = rule?.key || '@global';
            const compoundId = `${sheetId}${classId}`; // try to generate an unique Id _without_ a counter
            let hash = fastHash(compoundId);
            const maxCounter = 1e10;
            let counter = 2;
            for (; counter <= maxCounter; counter++) {
                const owner = takenHashes.get(hash);
                if (!owner || (owner === compoundId)) {
                    takenHashes.set(hash, compoundId);
                    return hash;
                } // if
                hash = fastHash(`${compoundId}${counter}`); // try to generate an unique Id _with_ a counter
            } // for
            warning(false, `[JSS] You might have a memory leak. ID counter is at ${counter}.`);
            return hash;
        })();
        const prefix = sheet?.options?.classNamePrefix ?? 'c';
        return `${prefix}${globalID}`;
    };
};
const customJss = createJss().setup({ createGenerateId, plugins: [
        jssPluginNested((styles) => mergeStyles(styles)),
        jssPluginShort(),
        jssPluginCamelCase(),
        jssPluginVendor(),
    ] });
// styles:
let sheetCounter = 0;
export const createJssSheet = (styles, sheetId) => {
    sheetCounter++;
    const stylesObj = ((typeof (styles) === 'function') ? styles() : styles);
    return customJss.createStyleSheet(stylesObj, 
    /*options:*/ {
        index: sheetCounter,
        sheetId: sheetId ?? stylesObj, // custom prop - for identifier purpose
    });
};
export const createSheet = (classes, sheetId) => {
    return createJssSheet(() => usesCssfn(classes), sheetId);
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
    ) ?? emptyMergedStyle);
};
// processors:
const isStyle = (object) => object && (typeof (object) === 'object') && !Array.isArray(object);
const mergeLiteral = (style, newStyle) => {
    for (const [propName, newPropValue] of [
        ...Object.entries(newStyle),
        ...Object.getOwnPropertySymbols(newStyle).map((sym) => [sym, newStyle[sym]]),
    ]) { // loop through `newStyle`'s props
        if (!isStyle(newPropValue)) {
            // `newPropValue` is not a `Style` => unmergeable => add/overwrite `newPropValue` into `style`:
            delete style[propName]; // delete the old prop (if any), so the new prop always placed at the end of LiteralObject
            style[propName] = newPropValue; // add/overwrite
        }
        else {
            // `newPropValue` is a `Style` => possibility to merge with `currentPropValue`
            const currentPropValue = style[propName];
            if (!isStyle(currentPropValue)) {
                // `currentPropValue` is not a `Style` => unmergeable => add/overwrite `newPropValue` into `style`:
                delete style[propName]; // delete the old prop (if any), so the new prop always placed at the end of LiteralObject
                style[propName] = newPropValue; // add/overwrite
            }
            else {
                // both `newPropValue` & `currentPropValue` are `Style` => merge them recursively (deeply):
                const currentValueClone = { ...currentPropValue }; // clone the `currentPropValue` to avoid side effect, because the `currentPropValue` is not **the primary object** we're working on
                mergeLiteral(currentValueClone, newPropValue);
                // merging style prop no need to rearrange the prop position
                style[propName] = currentValueClone; // set the mutated `currentValueClone` back to `style`
            } // if
        } // if
    } // for
};
const mergeNested = (style) => {
    //#region group (nested) Rule(s) by selector name
    const groupByNested = (Object.getOwnPropertySymbols(style)
        .reduce((accum, sym) => {
        const nestedSelector = sym.description ?? '';
        if (
        // nested rules:
        ((nestedSelector !== '&') // ignore only_parentSelector
            &&
                nestedSelector.includes('&') // nested rule
        )
            ||
                // conditional rules & globals:
                ['@media', '@supports', '@document', '@global'].some((at) => nestedSelector.startsWith(at))) {
            let group = accum.get(nestedSelector); // get an existing collector
            if (!group)
                accum.set(nestedSelector, group = []); // create a new collector
            group.push(sym);
        } // if
        return accum;
    }, new Map()));
    //#endregion group (nested) Rule(s) by selector name
    //#region merge duplicates (nested) Rule(s) to unique ones
    for (const group of Array.from(groupByNested.values())) {
        if (group.length <= 1)
            continue; // filter out groups with single/no member
        const mergedStyles = mergeStyles(group.map((sym) => style[sym]));
        if (mergedStyles) {
            // update last member
            style[group[group.length - 1]] = mergedStyles; // merge all member's style to the last member
        }
        else {
            // mergedStyles is empty => delete last member
            delete style[group[group.length - 1]];
        } // if
        for (const sym of group.slice(0, -1))
            delete style[sym]; // delete first member to second last member
    } // for
    //#endregion merge duplicates (nested) Rule to unique ones
    //#region merge only_parentSelector to current style
    let moveNestedRules = false;
    for (const sym of Object.getOwnPropertySymbols(style)) {
        if (sym.description === '&') {
            /* move the CssProps and (nested)Rules from only_parentSelector to current style */
            const parentStyles = style[sym];
            const mergedParentStyles = mergeStyles(parentStyles);
            if (mergedParentStyles) {
                if (!moveNestedRules) {
                    const hasNestedRule = !!Object.getOwnPropertySymbols(mergedParentStyles).length;
                    if (hasNestedRule)
                        moveNestedRules = true;
                } // if
                mergeLiteral(style, mergedParentStyles); // merge into current style
                delete style[sym]; // merged => delete source
            } // if
        }
        else if (moveNestedRules) {
            /* preserve the order of another (nested)Rules */
            const nestedStyles = style[sym]; // backup
            delete style[sym]; // delete
            style[sym] = nestedStyles; // restore (re-insert at the last order)
        } // if
    } // for
    //#endregion merge only_parentSelector to current style
    return style;
};
// prevents JSS to clone the CSSFN Style (because the symbol props are not copied)
class MergedStyle {
    constructor(style) {
        if (style)
            Object.assign(this, style);
    }
}
;
const emptyMergedStyle = new MergedStyle();
Object.seal(emptyMergedStyle);
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
        const mergedStyles = new MergedStyle(styleValue);
        mergeNested(mergedStyles);
        // do not return an empty style, instead return null:
        if ((!Object.keys(mergedStyles).length) && (!Object.getOwnPropertySymbols(mergedStyles).length))
            return null; // an empty object => return `null`
        // return non empty style:
        return mergedStyles;
    } // if
    const mergedStyles = new MergedStyle();
    for (const subStyles of styles) { // shallow iterating array
        const subStyleValue = (Array.isArray(subStyles)
            ?
                // deep iterating array
                mergeStyles(subStyles) // an array => ProductOrFactoryDeepArray<OptionalOrFalse<Style>> => recursively `mergeStyles()`
            :
                // final element => might be a function or a product
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
        // merge current style to single big style (string props + symbol props):
        mergeLiteral(mergedStyles, subStyleValue);
        mergeNested(mergedStyles); // merge nested immediately after literal, to preserve prop order in mergedStyles and in mergedStyles[Symbol('&')]
    } // for
    // do not return an empty style, instead return null:
    if ((!Object.keys(mergedStyles).length) && (!Object.getOwnPropertySymbols(mergedStyles).length))
        return null; // an empty object => return `null`
    // return non empty style:
    return mergedStyles;
};
const nthChildNSelector = pseudoClassSelector('nth-child', 'n');
const adjustSpecificityWeight = (selectorList, minSpecificityWeight, maxSpecificityWeight) => {
    if ((minSpecificityWeight == null)
        &&
            (maxSpecificityWeight == null))
        return selectorList; // nothing to adjust
    const selectorListBySpecificityWeightStatus = selectorList.map((selector) => selector.filter(isNotEmptySelectorEntry)).reduce((accum, selector) => {
        const [specificityWeight, weightStatus] = (() => {
            const specificityWeight = calculateSpecificity(selector)[1];
            if ((maxSpecificityWeight !== null) && (specificityWeight > maxSpecificityWeight)) {
                return [specificityWeight, 1 /* TooBig */];
            } // if
            if ((minSpecificityWeight !== null) && (specificityWeight < minSpecificityWeight)) {
                return [specificityWeight, 2 /* TooSmall */];
            } // if
            return [specificityWeight, 0 /* Fit */];
        })();
        let group = accum.get(weightStatus); // get an existing collector
        if (!group)
            accum.set(weightStatus, group = []); // create a new collector
        group.push({ selector, specificityWeight });
        return accum;
    }, new Map());
    //#endregion group selectors by specificity weight status
    const fitSelectors = selectorListBySpecificityWeightStatus.get(0 /* Fit */) ?? [];
    const tooBigSelectors = selectorListBySpecificityWeightStatus.get(1 /* TooBig */) ?? [];
    const tooSmallSelectors = selectorListBySpecificityWeightStatus.get(2 /* TooSmall */) ?? [];
    return createSelectorList(...fitSelectors.map((group) => group.selector), ...tooBigSelectors.flatMap((group) => {
        const reversedSelector = group.selector.reverse(); // reverse & mutate the current `group.selector` array
        const { reducedSelector: reversedReducedSelector, remaining: remainingSpecificityWeight } = (reversedSelector.slice(0) // clone the `reversedSelector` because the `reduce()` uses `splice()` to break the iteration
            .reduce((accum, selectorEntry, index, array) => {
            if (accum.remaining <= 0) {
                array.splice(1); // eject early by mutating iterated copy - it's okay to **mutate** the `array` because it already cloned at `slice(0)`
                return accum;
            } // if
            if (isSimpleSelector(selectorEntry)) {
                const [
                /*
                    selector tokens:
                    '&'  = parent         selector
                    '*'  = universal      selector
                    '['  = attribute      selector
                    ''   = element        selector
                    '#'  = ID             selector
                    '.'  = class          selector
                    ':'  = pseudo class   selector
                    '::' = pseudo element selector
                */
                selectorToken, 
                /*
                    selector name:
                    string = the name of [element, ID, class, pseudo class, pseudo element] selector
                */
                selectorName,
                /*
                    selector parameter(s):
                    string       = the parameter of pseudo class selector, eg: nth-child(2n+3) => '2n+3'
                    array        = [name, operator, value, options] of attribute selector, eg: [data-msg*="you & me" i] => ['data-msg', '*=', 'you & me', 'i']
                    SelectorList = nested selector(s) of pseudo class [:is(...), :where(...), :not(...)]
                */
                // selectorParams,
                ] = selectorEntry;
                if (selectorToken === ':') {
                    switch (selectorName) {
                        case 'is':
                        case 'not':
                        case 'has':
                            const specificityWeight = calculateSpecificity([selectorEntry])[1];
                            accum.remaining -= specificityWeight; // reduce the counter
                            break;
                        case 'where':
                            break; // don't reduce the counter
                        default:
                            accum.remaining--; // reduce the counter
                    } // switch
                }
                else if (['.', '[',].includes(selectorToken)) {
                    accum.remaining--; // reduce the counter
                } // if
            } // if
            accum.reducedSelector.push(selectorEntry);
            return accum;
        }, {
            remaining: (group.specificityWeight - (maxSpecificityWeight ?? group.specificityWeight)),
            reducedSelector: [],
        }));
        const [whereSelector, ...pseudoElmSelectors] = groupSelector(reversedReducedSelector.reverse(), { selectorName: 'where' });
        whereSelector.unshift(...reversedSelector.slice(reversedReducedSelector.length).reverse());
        whereSelector.push(...(new Array((remainingSpecificityWeight < 0) ? -remainingSpecificityWeight : 0)).fill(nthChildNSelector // or use `nth-child(n)`
        ));
        return createSelectorList(whereSelector, ...pseudoElmSelectors);
    }), ...tooSmallSelectors.map((group) => createSelector(...group.selector, ...(new Array((minSpecificityWeight ?? 1) - group.specificityWeight)).fill(group.selector
        .filter(isClassOrPseudoClassSelector) // only interested to class selector -or- pseudo class selector
        .filter((simpleSelector) => {
        const [
        /*
            selector tokens:
            '&'  = parent         selector
            '*'  = universal      selector
            '['  = attribute      selector
            ''   = element        selector
            '#'  = ID             selector
            '.'  = class          selector
            ':'  = pseudo class   selector
            '::' = pseudo element selector
        */
        // selectorToken
        , 
        /*
            selector name:
            string = the name of [element, ID, class, pseudo class, pseudo element] selector
        */
        // selectorName
        , 
        /*
            selector parameter(s):
            string       = the parameter of pseudo class selector, eg: nth-child(2n+3) => '2n+3'
            array        = [name, operator, value, options] of attribute selector, eg: [data-msg*="you & me" i] => ['data-msg', '*=', 'you & me', 'i']
            SelectorList = nested selector(s) of pseudo class [:is(...), :where(...), :not(...)]
        */
        selectorParams,] = simpleSelector;
        return (selectorParams === undefined);
    })
        .pop() // repeats the last selector until minSpecificityWeight satisfied
        ??
            nthChildNSelector // or use `nth-child(n)`
    ))));
};
const defaultSelectorOptions = {
    groupSelectors: true,
    specificityWeight: null,
    minSpecificityWeight: null,
    maxSpecificityWeight: null,
};
export const mergeSelectors = (selectorList, options = defaultSelectorOptions) => {
    const { groupSelectors: doGroupSelectors = defaultSelectorOptions.groupSelectors, specificityWeight, } = options;
    const minSpecificityWeight = specificityWeight ?? options.minSpecificityWeight ?? null;
    const maxSpecificityWeight = specificityWeight ?? options.maxSpecificityWeight ?? null;
    if (!doGroupSelectors // do not perform grouping
        &&
            (minSpecificityWeight === null) && (maxSpecificityWeight === null) // do not perform transform
    )
        return selectorList; // nothing to do
    const normalizedSelectorList = (selectorList
        .flatMap((selector) => ungroupSelector(selector))
        .filter(isNotEmptySelector));
    if ((!doGroupSelectors || (normalizedSelectorList.length <= 1)) // do not perform grouping || only singular => nothing to group
        &&
            (minSpecificityWeight === null) && (maxSpecificityWeight === null) // do not perform transform
    )
        return normalizedSelectorList; // nothing to do
    // transform:
    const adjustedSelectorList = adjustSpecificityWeight(normalizedSelectorList, minSpecificityWeight, maxSpecificityWeight);
    if ((!doGroupSelectors || (adjustedSelectorList.length <= 1)) // do not perform grouping || only singular => nothing to group
    )
        return adjustedSelectorList; // nothing to do
    const selectorListByParentPosition = adjustedSelectorList.map((selector) => selector.filter(isNotEmptySelectorEntry)).reduce((accum, selector) => {
        const position = (() => {
            const hasFirstParent = (() => {
                if (selector.length < 1)
                    return false; // at least 1 entry must exist, for the first_parent
                const firstSelectorEntry = selector[0]; // take the first entry
                return isParentSelector(firstSelectorEntry); // the entry must be ParentSelector
            })();
            const onlyParent = hasFirstParent && (selector.length === 1);
            if (onlyParent)
                return 0 /* OnlyParent */;
            const hasMiddleParent = (() => {
                if (selector.length < 3)
                    return false; // at least 3 entry must exist, the first & last are already reserved, the middle one is the middle_parent
                for (let index = 1, maxIndex = (selector.length - 2); index <= maxIndex; index++) {
                    const middleSelectorEntry = selector[index]; // take the 2nd_first_entry until the 2nd_last_entry
                    if (isParentSelector(middleSelectorEntry))
                        return true; // the entry must be ParentSelector, otherwise skip to next
                } // for
                return false; // ran out of iterator => not found
            })();
            const hasLastParent = (() => {
                const length = selector.length;
                if (length < 2)
                    return false; // at least 2 entry must exist, the first is already reserved, the last one is the last_parent
                const lastSelectorEntry = selector[length - 1]; // take the last entry
                return isParentSelector(lastSelectorEntry); // the entry must be ParentSelector
            })();
            const onlyBeginParent = hasFirstParent && !hasMiddleParent && !hasLastParent;
            if (onlyBeginParent)
                return 1 /* OnlyBeginParent */;
            const onlyEndParent = !hasFirstParent && !hasMiddleParent && hasLastParent;
            if (onlyEndParent)
                return 2 /* OnlyEndParent */;
            return 3 /* RandomParent */;
        })();
        let group = accum.get(position); // get an existing collector
        if (!group)
            accum.set(position, group = []); // create a new collector
        group.push(selector);
        return accum;
    }, new Map());
    //#endregion group selectors by parent position
    const onlyParentSelectorList = selectorListByParentPosition.get(0 /* OnlyParent */) ?? [];
    const onlyBeginParentSelectorList = selectorListByParentPosition.get(1 /* OnlyBeginParent */) ?? [];
    const onlyEndParentSelectorList = selectorListByParentPosition.get(2 /* OnlyEndParent */) ?? [];
    const randomParentSelectorList = selectorListByParentPosition.get(3 /* RandomParent */) ?? [];
    const createGroupByCombinator = (fetch) => (accum, selector) => {
        const combinator = fetch(selector);
        let group = accum.get(combinator); // get an existing collector
        if (!group)
            accum.set(combinator, group = []); // create a new collector
        group.push(selector);
        return accum;
    };
    const groupedSelectorList = createSelectorList(
    // only ParentSelector
    // &
    !!onlyParentSelectorList.length && (onlyParentSelectorList[0] // just take the first one, the rest are guaranteed to be the same
    ), 
    // ParentSelector at beginning
    // &aaa
    // &:is(aaa, bbb, ccc)
    ...(() => {
        if (onlyBeginParentSelectorList.length <= 1)
            return onlyBeginParentSelectorList; // only contain one/no Selector, no need to group
        //#region group selectors by combinator
        const selectorListByCombinator = onlyBeginParentSelectorList.reduce(createGroupByCombinator((selector) => {
            if (selector.length >= 2) { // at least 2 entry must exist, for the first_parent followed by combinator
                const secondSelectorEntry = selector[1]; // take the first_second entry
                if (isCombinator(secondSelectorEntry)) { // the entry must be the same as combinator
                    return secondSelectorEntry;
                } // if
            } // if
            return null; // ungroupable
        }), new Map());
        //#endregion group selectors by combinator
        return Array.from(selectorListByCombinator.entries()).flatMap(([combinator, selectors]) => {
            if (selectors.length <= 1)
                return selectors; // only contain one/no Selector, no need to group
            if (selectors.filter((selector) => selector.every(isNotPseudoElementSelector)).length <= 1)
                return selectors; // only contain one/no Selector without ::pseudo-element, no need to group
            const [isSelector, ...pseudoElmSelectors] = groupSelectors(selectors
                .filter(isNotEmptySelector) // remove empty Selector(s) in SelectorList
                .map((selector) => selector.slice((combinator
                ?
                    2 // remove the first_parent & combinator
                :
                    1 // remove the first_parent
            )
                +
                    (selector.some(isPseudoElementSelector) ? -1 : 0) // exception for ::pseudo-element => do not remove the first_parent
            )), { selectorName: 'is' });
            return createSelectorList(isNotEmptySelector(isSelector) && createSelector(parentSelector(), // add a ParentSelector      before :is(...)
            combinator, // add a Combinator (if any) before :is(...)
            ...isSelector), ...pseudoElmSelectors);
        });
    })(), 
    // ParentSelector at end
    // aaa&
    // :is(aaa, bbb, ccc)&
    ...(() => {
        if (onlyEndParentSelectorList.length <= 1)
            return onlyEndParentSelectorList; // only contain one/no Selector, no need to group
        //#region group selectors by combinator
        const selectorListByCombinator = onlyEndParentSelectorList.reduce(createGroupByCombinator((selector) => {
            const length = selector.length;
            if (length >= 2) { // at least 2 entry must exist, for the combinator followed by last_parent
                const secondSelectorEntry = selector[length - 2]; // take the last_second entry
                if (isCombinator(secondSelectorEntry)) { // the entry must be the same as combinator
                    return secondSelectorEntry;
                } // if
            } // if
            return null; // ungroupable
        }), new Map());
        //#endregion group selectors by combinator
        return Array.from(selectorListByCombinator.entries()).flatMap(([combinator, selectors]) => {
            if (selectors.length <= 1)
                return selectors; // only contain one/no Selector, no need to group
            if (selectors.filter((selector) => selector.every(isNotPseudoElementSelector)).length <= 1)
                return selectors; // only contain one/no Selector without ::pseudo-element, no need to group
            const [isSelector, ...pseudoElmSelectors] = groupSelectors(selectors
                .filter(isNotEmptySelector) // remove empty Selector(s) in SelectorList
                .map((selector) => selector.slice(0, (combinator
                ?
                    -2 // remove the combinator & last_parent
                :
                    -1 // remove the last_parent
            )
                +
                    (selector.some(isPseudoElementSelector) ? 1 : 0) // exception for ::pseudo-element => do not remove the last_parent
            )), { selectorName: 'is' });
            return createSelectorList(isNotEmptySelector(isSelector) && createSelector(...isSelector, // :is(...)
            combinator, // add a Combinator (if any) after :is(...)
            parentSelector()), ...pseudoElmSelectors);
        });
    })(), 
    // parent at random
    // a&aa, bb&b, c&c&c
    ...randomParentSelectorList);
    return groupedSelectorList;
};
// compositions:
/**
 * Defines the additional component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export const compositionOf = (className, ...styles) => [
    className,
    styles
];
// shortcut compositions:
/**
 * Defines the main component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export const mainComposition = (...styles) => compositionOf('main', ...styles);
/**
 * Defines the global style applied to a whole document.
 * @returns A `ClassEntry` represents the global style.
 */
export const globalDef = (...rules) => compositionOf('', ...rules);
// styles:
/**
 * @deprecated move to `style()`
 * Defines the (sub) component's composition.
 * @returns A `Rule` represents the (sub) component's composition.
 */
export const composition = (...styles) => noRule(...styles);
/**
 * Defines component's style.
 * @returns A `Rule` represents the component's style.
 */
export const style = (style) => noRule(style);
/**
 * @deprecated move to `style()`
 * Defines component's layout.
 * @returns A `Rule` represents the component's layout.
 */
export const layout = (style) => noRule(style);
/**
 * Defines component's variable(s).
 * @returns A `Rule` represents the component's variable(s).
 */
export const vars = (items) => noRule(items);
export const imports = (...styles) => noRule(...styles);
// rules:
/**
 * Defines component's `style(s)` that is applied when the specified `selector(s)` meet the conditions.
 * @returns A `Rule` represents the component's rule.
 */
export const rule = (rules, styles, options = defaultSelectorOptions) => {
    const rulesString = (flat(rules)
        .filter((rule) => !!rule));
    const rulesByTypes = rulesString.reduce((accum, rule) => {
        let ruleType = (() => {
            if (rule.startsWith('@'))
                return 1 /* AtRule */;
            if (rule.startsWith(' '))
                return 2 /* PropRule */;
            if (rule.includes('&'))
                return 0 /* SelectorRule */;
            return null;
        })();
        switch (ruleType) {
            case 2 /* PropRule */:
                rule = rule.slice(1);
                break;
            case null:
                ruleType = 0 /* SelectorRule */;
                rule = `&${rule}`;
                break;
        } // switch
        let group = accum.get(ruleType); // get an existing collector
        if (!group)
            accum.set(ruleType, group = []); // create a new collector
        group.push(rule);
        return accum;
    }, new Map());
    const selectorList = ((rulesByTypes.get(0 /* SelectorRule */) ?? [])
        .flatMap((selector) => {
        const selectorList = parseSelectors(selector);
        if (!selectorList)
            throw Error(`parse selector error: ${selector}`);
        return selectorList;
    })
        .filter(isNotEmptySelector));
    const mergedSelectorList = mergeSelectors(selectorList, options);
    return {
        ...(isNotEmptySelectors(mergedSelectorList) ? {
            [Symbol(selectorsToString(mergedSelectorList))]: styles
        } : {}),
        ...Object.fromEntries([
            ...(rulesByTypes.get(1 /* AtRule */) ?? []),
            ...(rulesByTypes.get(2 /* PropRule */) ?? []),
        ].map((rule) => [
            Symbol(rule),
            styles
        ])),
    };
};
// rule groups:
export const rules = (rules, options = defaultSelectorOptions) => {
    const result = (flat(rules)
        .filter((rule) => !!rule)
        .flatMap((ruleProductOrFactory) => {
        if (typeof (ruleProductOrFactory) === 'function')
            return [ruleProductOrFactory()];
        return [ruleProductOrFactory];
    })
        .filter((optionalRule) => !!optionalRule));
    if (!options)
        return Object.assign({}, ...result);
    return Object.assign({}, ...result
        .flatMap((rule) => Object.getOwnPropertySymbols(rule).map((sym) => [sym.description ?? '', rule[sym]]))
        .map(([selectors, styles]) => rule(selectors, styles, options)));
};
const defaultVariantOptions = {
    ...defaultSelectorOptions,
    maxSpecificityWeight: 2,
};
/**
 * Defines component's variants.
 * @returns A `Rule` represents the component's variants.
 */
export const variants = (variants, options = defaultVariantOptions) => rules(variants, options);
const defaultStateOptions = {
    ...defaultSelectorOptions,
    specificityWeight: 3,
    inherit: false,
};
/**
 * Defines component's states.
 * @param inherit `true` to inherit states from parent element -or- `false` to create independent states.
 * @returns A `Rule` represents the component's states.
 */
export const states = (states, options = defaultStateOptions) => {
    const { inherit = defaultStateOptions.inherit, } = options;
    return rules((typeof (states) === 'function') ? states(inherit) : states, options);
};
// rule shortcuts:
export const keyframes = (name, items) => rule(`@keyframes ${name}`, Object.fromEntries(Object.entries(items).map(([key, frame]) => [Symbol(key), frame])));
export const noRule = (...styles) => rule('&', styles);
export const emptyRule = () => rule(null, null);
export const fallbacks = (...styles) => rule('@fallbacks', styles);
export const fontFace = (...styles) => rule('@font-face', styles);
export const atGlobal = (...rules) => rule('@global', rules);
export const atRoot = (...styles) => rule(':root', styles);
export const isFirstChild = (...styles) => rule(':first-child', styles);
export const isNotFirstChild = (...styles) => rule(':not(:first-child)', styles);
export const isLastChild = (...styles) => rule(':last-child', styles);
export const isNotLastChild = (...styles) => rule(':not(:last-child)', styles);
export const isNthChild = (step, offset, ...styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return emptyRule(); // 0th => never => return empty rule
        if (offset === 1)
            return isFirstChild(styles); // 1st
        return rule(`:nth-child(${offset})`, styles); // 2nd, 3rd, 4th, ...
    }
    else if (step === 1) { // 1 step
        if (offset === 0)
            return rule(`:nth-child(n)`, styles); // always match
        return rule(`:nth-child(n+${offset})`, styles);
    }
    else { // 2+ steps
        if (offset === 0)
            return rule(`:nth-child(${step}n)`, styles);
        return rule(`:nth-child(${step}n+${offset})`, styles);
    } // if
};
export const isNotNthChild = (step, offset, ...styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return isNthChild(1, 0, styles); // not 0th => not never => always match
        if (offset === 1)
            return isNotFirstChild(styles); // not 1st
        return rule(`:not(:nth-child(${offset}))`, styles); // not 2nd, not 3rd, not 4th, not ...
    }
    else if (step === 1) { // 1 step
        if (offset === 0)
            return emptyRule(); // never match
        return rule(`:not(:nth-child(n+${offset}))`, styles);
    }
    else { // 2+ steps
        if (offset === 0)
            return rule(`:not(:nth-child(${step}n))`, styles);
        return rule(`:not(:nth-child(${step}n+${offset}))`, styles);
    } // if
};
export const isNthLastChild = (step, offset, ...styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return emptyRule(); // 0th => never => return empty rule
        if (offset === 1)
            return isLastChild(styles); // 1st
        return rule(`:nth-last-child(${offset})`, styles); // 2nd, 3rd, 4th, ...
    }
    else if (step === 1) { // 1 step
        if (offset === 0)
            return rule(`:nth-last-child(n)`, styles); // always match
        return rule(`:nth-last-child(n+${offset})`, styles);
    }
    else { // 2+ steps
        if (offset === 0)
            return rule(`:nth-last-child(${step}n)`, styles);
        return rule(`:nth-last-child(${step}n+${offset})`, styles);
    } // if
};
export const isNotNthLastChild = (step, offset, ...styles) => {
    if (step === 0) { // no step
        if (offset === 0)
            return isNthChild(1, 0, styles); // not 0th last => not never => always match
        if (offset === 1)
            return isNotLastChild(styles); // not 1st last
        return rule(`:not(:nth-last-child(${offset}))`, styles); // not 2nd last, not 3rd last, not 4th last, not ... last
    }
    else if (step === 1) { // 1 step
        if (offset === 0)
            return emptyRule(); // never match
        return rule(`:not(:nth-last-child(n+${offset}))`, styles);
    }
    else { // 2+ steps
        if (offset === 0)
            return rule(`:not(:nth-last-child(${step}n))`, styles);
        return rule(`:not(:nth-last-child(${step}n+${offset}))`, styles);
    } // if
};
export const isActive = (...styles) => rule(':active', styles);
export const isNotActive = (...styles) => rule(':not(:active)', styles);
export const isFocus = (...styles) => rule(':focus', styles);
export const isNotFocus = (...styles) => rule(':not(:focus)', styles);
export const isFocusVisible = (...styles) => rule(':focus-visible', styles);
export const isNotFocusVisible = (...styles) => rule(':not(:focus-visible)', styles);
export const isHover = (...styles) => rule(':hover', styles);
export const isNotHover = (...styles) => rule(':not(:hover)', styles);
export const isEmpty = (...styles) => rule(':empty', styles);
export const isNotEmpty = (...styles) => rule(':not(:empty)', styles);
//combinators:
export const combinators = (combinator, selectors, styles, options = defaultSelectorOptions) => {
    const combiSelectors = flat(selectors).filter((selector) => !!selector).map((selector) => {
        // if (selector === '&') return selector; // no children => the parent itself
        if (selector.includes('&'))
            return selector; // custom combinator
        if (((combinator === ' ') || (combinator === '>')) && selector.startsWith('::'))
            return `&${selector}`; // pseudo element => attach the parent itself (for descendants & children)
        return `&${combinator}${selector}`;
    });
    if (!combiSelectors.length)
        return {}; // no selector => return empty
    return rule(combiSelectors, styles, options);
};
export const descendants = (selectors, styles, options = defaultSelectorOptions) => combinators(' ', selectors, styles, options);
export const children = (selectors, styles, options = defaultSelectorOptions) => combinators('>', selectors, styles, options);
export const siblings = (selectors, styles, options = defaultSelectorOptions) => combinators('~', selectors, styles, options);
export const nextSiblings = (selectors, styles, options = defaultSelectorOptions) => combinators('+', selectors, styles, options);
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
    return collection.flat(Infinity);
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
