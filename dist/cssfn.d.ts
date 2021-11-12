import { JssStyle, JssValue, Classes, Styles, StyleSheet } from 'jss';
import { ExtendableStyle } from '@cssfn/jss-plugin-extend';
import type { OptionalOrFalse, SingleOrArray, SingleOrDeepArray, ProductOrFactoryOrDeepArray, ProductOrFactory, Dictionary, ValueOf, DictionaryOf } from '@cssfn/types';
import type { Prop, PropEx, Cust } from '@cssfn/css-types';
import { pascalCase } from 'pascal-case';
import { camelCase } from 'camel-case';
export type { JssStyle, JssValue, Classes, Styles, StyleSheet };
export type { Prop, PropEx, Cust };
export type { Dictionary, ValueOf, DictionaryOf };
export declare type Style = (ExtendableStyle & {});
export declare type StyleCollection = ProductOrFactoryOrDeepArray<OptionalOrFalse<Style>>;
export declare type ClassName = string;
export declare type RealClass = (`.${ClassName}` & {});
export declare type PseudoClass = (`:${ClassName}` & {});
export declare type Class = RealClass | PseudoClass;
export declare type ClassEntry<TClassName extends ClassName = ClassName> = readonly [TClassName, StyleCollection];
export declare type ClassList<TClassName extends ClassName = ClassName> = ClassEntry<TClassName>[];
export declare type OptionalString = OptionalOrFalse<string>;
export declare type UniversalSelector = ('*' & {});
export declare type RealElementSelector = (string & {});
export declare type PseudoElementSelector = (`::${string}` & {});
export declare type ElementSelector = RealElementSelector | PseudoElementSelector;
export declare type ClassSelector = (Class & {});
export declare type IdSelector = (`#${string}` & {});
export declare type SingleSelector = UniversalSelector | ElementSelector | ClassSelector | IdSelector;
export declare type Selector = SingleSelector | (`${SingleSelector}${SingleSelector}` & {}) | (`${SingleSelector}${SingleSelector}${SingleSelector}` & {}) | (`${SingleSelector}${SingleSelector}${SingleSelector}${SingleSelector}` & {}) | (`${SingleSelector}${SingleSelector}${SingleSelector}${SingleSelector}${SingleSelector}` & {});
export declare type SelectorCollection = SingleOrDeepArray<OptionalOrFalse<Selector>>;
export declare type NestedSelector = '&' | (`&${Selector}` & {}) | (`${Selector}&` & {});
export declare type RuleEntry = readonly [SelectorCollection, StyleCollection];
export declare type RuleEntrySource = ProductOrFactory<OptionalOrFalse<RuleEntry>>;
export declare type RuleList = RuleEntrySource[];
export declare type RuleCollection = SingleOrArray<RuleEntrySource | RuleList>;
export declare type PropList = Dictionary<JssValue>;
export declare const createJssSheet: <TClassName extends string = string>(styles: ProductOrFactory<Styles<TClassName, unknown, undefined>>) => StyleSheet<TClassName>;
export declare const createSheet: <TClassName extends string = string>(classes: ProductOrFactory<ClassList<TClassName>>) => StyleSheet<TClassName>;
export declare const usesCssfn: <TClassName extends string = string>(classes: ProductOrFactory<ClassList<TClassName>>) => Styles<TClassName, unknown, undefined>;
/**
 * Defines the (sub) component's composition.
 * @returns A `StyleCollection` represents the (sub) component's composition.
 */
export declare const composition: (styles: StyleCollection[]) => StyleCollection;
/**
 * Merges the (sub) component's composition to single `Style`.
 * @returns A `Style` represents the merged (sub) component's composition
 * -or-
 * `null` represents an empty `Style`.
 */
export declare const mergeStyles: (styles: StyleCollection) => Style | null;
/**
 * Defines the additional component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export declare const compositionOf: <TClassName extends string = string>(className: TClassName, styles: StyleCollection[]) => ClassEntry<TClassName>;
/**
 * Defines the main component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export declare const mainComposition: (styles: StyleCollection[]) => ClassEntry<"main">;
/**
 * Defines the global style applied to a whole document.
 * @returns A `ClassEntry` represents the global style.
 */
export declare const global: (ruleCollection: RuleCollection) => ClassEntry<"">;
export declare const imports: (styles: StyleCollection[]) => StyleCollection;
/**
 * Defines component's layout.
 * @returns A `Style` represents the component's layout.
 */
export declare const layout: (style: Style) => Style;
/**
 * Defines component's variable(s).
 * @returns A `Style` represents the component's variable(s).
 */
export declare const vars: (items: {
    [name: string]: JssValue;
}) => Style;
export interface CombinatorOptions {
    groupSelectors?: boolean;
}
export declare const combinators: (combinator: string, selectors: SelectorCollection, styles: StyleCollection, options?: CombinatorOptions) => PropList;
export declare const descendants: (selectors: SelectorCollection, styles: StyleCollection, options?: CombinatorOptions) => PropList;
export declare const children: (selectors: SelectorCollection, styles: StyleCollection, options?: CombinatorOptions) => PropList;
export declare const siblings: (selectors: SelectorCollection, styles: StyleCollection, options?: CombinatorOptions) => PropList;
export declare const adjacentSiblings: (selectors: SelectorCollection, styles: StyleCollection, options?: CombinatorOptions) => PropList;
export interface RuleOptions {
    minSpecificityWeight?: number;
}
export declare const rules: (ruleCollection: RuleCollection, options?: RuleOptions) => StyleCollection;
/**
 * Defines component's variants.
 * @returns A `StyleCollection` represents the component's variants.
 */
export declare const variants: (variants: RuleCollection, options?: RuleOptions) => StyleCollection;
/**
 * Defines component's states.
 * @param inherit `true` to inherit states from parent element -or- `false` to create independent states.
 * @returns A `StyleCollection` represents the component's states.
 */
export declare const states: (states: RuleCollection | ((inherit: boolean) => RuleCollection), inherit?: boolean, options?: RuleOptions) => StyleCollection;
/**
 * Defines component's `style(s)` that is applied when the specified `selector(s)` meet the conditions.
 * @returns A `RuleEntry` represents the component's rule.
 */
export declare const rule: (selectors: SelectorCollection, styles: StyleCollection) => RuleEntry;
export declare const noRule: (styles: StyleCollection) => RuleEntry;
export declare const emptyRule: () => RuleEntry;
export declare const atRoot: (styles: StyleCollection) => RuleEntry;
export declare const atGlobal: (styles: StyleCollection) => RuleEntry;
export declare const fontFace: (styles: StyleCollection) => RuleEntry;
export declare const isFirstChild: (styles: StyleCollection) => RuleEntry;
export declare const isNotFirstChild: (styles: StyleCollection) => RuleEntry;
export declare const isLastChild: (styles: StyleCollection) => RuleEntry;
export declare const isNotLastChild: (styles: StyleCollection) => RuleEntry;
export declare const isNthChild: (step: number, offset: number, styles: StyleCollection) => RuleEntry;
export declare const isNotNthChild: (step: number, offset: number, styles: StyleCollection) => RuleEntry;
export declare const isNthLastChild: (step: number, offset: number, styles: StyleCollection) => RuleEntry;
export declare const isNotNthLastChild: (step: number, offset: number, styles: StyleCollection) => RuleEntry;
export declare const isActive: (styles: StyleCollection) => RuleEntry;
export declare const isNotActive: (styles: StyleCollection) => RuleEntry;
export declare const isFocus: (styles: StyleCollection) => RuleEntry;
export declare const isNotFocus: (styles: StyleCollection) => RuleEntry;
export declare const isFocusVisible: (styles: StyleCollection) => RuleEntry;
export declare const isNotFocusVisible: (styles: StyleCollection) => RuleEntry;
export declare const isHover: (styles: StyleCollection) => RuleEntry;
export declare const isNotHover: (styles: StyleCollection) => RuleEntry;
export declare const isEmpty: (styles: StyleCollection) => RuleEntry;
export declare const isNotEmpty: (styles: StyleCollection) => RuleEntry;
export declare const iif: <T extends Style | PropList>(condition: boolean, content: T) => T;
/**
 * Escapes some sets of character in svg data, so it will be valid to be written in css.
 * @param svgData The raw svg data to be escaped.
 * @returns A `string` represents an escaped svg data.
 */
export declare const escapeSvg: (svgData: string) => string;
/**
 * Creates a single layer solid background based on specified `color`.
 * @param color The color of the solid background to create.
 * @returns A `Cust.Expr` represents a solid background.
 */
export declare const solidBackg: (color: Cust.Expr, clip?: Prop.BackgroundClip) => Cust.Expr;
export { pascalCase, camelCase };
