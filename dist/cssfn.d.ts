import { Classes, Styles, StyleSheet } from 'jss';
import type { OptionalOrFalse, SingleOrDeepArray, ProductOrFactoryOrDeepArray, ProductOrFactory, Dictionary, ValueOf, DictionaryOf } from '@cssfn/types';
import type { Prop, PropEx, Cust } from '@cssfn/css-types';
import { Combinator, SelectorList as SelectorModelList } from '@cssfn/css-selector';
import { Properties as CssProperties } from 'csstype';
import { pascalCase } from 'pascal-case';
import { camelCase } from 'camel-case';
export type { Classes, Styles, StyleSheet };
export type { Prop, PropEx, Cust };
export type { Dictionary, ValueOf, DictionaryOf };
export declare type KnownCssPropName = keyof CssProperties<string | number>;
export declare type KnownCssPropValue<PropName extends KnownCssPropName> = Exclude<CssProperties<string | number>[PropName], (undefined | null)>;
export declare type KnownCssProps = {
    [PropName in keyof CssProperties<string | number>]?: (KnownCssPropValue<PropName> | [[KnownCssPropValue<PropName>], '!important'] | CssValue);
};
export declare type BasicCssValue = (string & {}) | (number & {}) | PropEx.Keyframes;
export declare type CssValue = undefined | null | BasicCssValue | BasicCssValue[] | (BasicCssValue | BasicCssValue[] | '!important')[];
export declare type CustomCssProps = {
    [PropName: Exclude<string, KnownCssPropName>]: CssValue;
};
export declare type CssProps = KnownCssProps & CustomCssProps;
export declare type Rule = {
    [PropName: symbol]: StyleCollection;
};
export declare type Style = CssProps & Rule;
export declare type StyleCollection = ProductOrFactoryOrDeepArray<OptionalOrFalse<Style>>;
export declare type ClassName = string;
export declare type RealClass = (`.${ClassName}` & {});
export declare type PseudoClass = (`:${ClassName}` & {});
export declare type Class = RealClass | PseudoClass;
export declare type ClassEntry<TClassName extends ClassName = ClassName> = readonly [TClassName, StyleCollection];
export declare type ClassList<TClassName extends ClassName = ClassName> = ClassEntry<TClassName>[];
export declare type OptionalString = OptionalOrFalse<string>;
export declare type Selector = (string & {});
export declare type SelectorCollection = SingleOrDeepArray<OptionalOrFalse<Selector>>;
export declare type RuleCollection = ProductOrFactoryOrDeepArray<OptionalOrFalse<Rule>>;
export declare const createJssSheet: <TClassName extends string = string>(styles: ProductOrFactory<Styles<TClassName, unknown, undefined>>, sheetId?: string | undefined) => StyleSheet<TClassName>;
export declare const createSheet: <TClassName extends string = string>(classes: ProductOrFactory<ClassList<TClassName>>, sheetId?: string | undefined) => StyleSheet<TClassName>;
export declare const usesCssfn: <TClassName extends string = string>(classes: ProductOrFactory<ClassList<TClassName>>) => Styles<TClassName, unknown, undefined>;
/**
 * Merges the (sub) component's composition to single `Style`.
 * @returns A `Style` represents the merged (sub) component's composition
 * -or-
 * `null` represents an empty `Style`.
 */
export declare const mergeStyles: (styles: StyleCollection) => Style | null;
export interface SelectorOptions {
    groupSelectors?: boolean;
    specificityWeight?: number | null;
    minSpecificityWeight?: number | null;
    maxSpecificityWeight?: number | null;
}
export declare const mergeSelectors: (selectorList: SelectorModelList, options?: SelectorOptions) => SelectorModelList;
/**
 * Defines the additional component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export declare const compositionOf: <TClassName extends string = string>(className: TClassName, ...styles: StyleCollection[]) => ClassEntry<TClassName>;
/**
 * Defines the main component's composition.
 * @returns A `ClassEntry` represents the component's composition.
 */
export declare const mainComposition: (...styles: StyleCollection[]) => ClassEntry<"main">;
/**
 * Defines the global style applied to a whole document.
 * @returns A `ClassEntry` represents the global style.
 */
export declare const globalDef: (...rules: RuleCollection[]) => ClassEntry<"">;
/**
 * @deprecated move to `style()`
 * Defines the (sub) component's composition.
 * @returns A `Rule` represents the (sub) component's composition.
 */
export declare const composition: (...styles: StyleCollection[]) => Rule;
/**
 * Defines component's style.
 * @returns A `Rule` represents the component's style.
 */
export declare const style: (style: Style) => Rule;
/**
 * @deprecated move to `style()`
 * Defines component's layout.
 * @returns A `Rule` represents the component's layout.
 */
export declare const layout: (style: Style) => Rule;
/**
 * Defines component's variable(s).
 * @returns A `Rule` represents the component's variable(s).
 */
export declare const vars: (items: {
    [key: `--${string}`]: CssValue;
}) => Rule;
export declare const imports: (...styles: StyleCollection[]) => Rule;
/**
 * Defines component's `style(s)` that is applied when the specified `selector(s)` meet the conditions.
 * @returns A `Rule` represents the component's rule.
 */
export declare const rule: (rules: SelectorCollection, styles: StyleCollection, options?: SelectorOptions) => Rule;
export declare const rules: (rules: RuleCollection, options?: SelectorOptions) => Rule;
/**
 * Defines component's variants.
 * @returns A `Rule` represents the component's variants.
 */
export declare const variants: (variants: RuleCollection, options?: SelectorOptions) => Rule;
export interface StateOptions extends SelectorOptions {
    inherit?: boolean;
}
/**
 * Defines component's states.
 * @param inherit `true` to inherit states from parent element -or- `false` to create independent states.
 * @returns A `Rule` represents the component's states.
 */
export declare const states: (states: RuleCollection | ((inherit: boolean) => RuleCollection), options?: StateOptions) => Rule;
export declare const keyframes: (name: string, items: PropEx.Keyframes) => Rule;
export declare const noRule: (...styles: StyleCollection[]) => Rule;
export declare const emptyRule: () => Rule;
export declare const fallbacks: (...styles: StyleCollection[]) => Rule;
export declare const fontFace: (...styles: StyleCollection[]) => Rule;
export declare const atGlobal: (...rules: RuleCollection[]) => Rule;
export declare const atRoot: (...styles: StyleCollection[]) => Rule;
export declare const isFirstChild: (...styles: StyleCollection[]) => Rule;
export declare const isNotFirstChild: (...styles: StyleCollection[]) => Rule;
export declare const isLastChild: (...styles: StyleCollection[]) => Rule;
export declare const isNotLastChild: (...styles: StyleCollection[]) => Rule;
export declare const isNthChild: (step: number, offset: number, ...styles: StyleCollection[]) => Rule;
export declare const isNotNthChild: (step: number, offset: number, ...styles: StyleCollection[]) => Rule;
export declare const isNthLastChild: (step: number, offset: number, ...styles: StyleCollection[]) => Rule;
export declare const isNotNthLastChild: (step: number, offset: number, ...styles: StyleCollection[]) => Rule;
export declare const isActive: (...styles: StyleCollection[]) => Rule;
export declare const isNotActive: (...styles: StyleCollection[]) => Rule;
export declare const isFocus: (...styles: StyleCollection[]) => Rule;
export declare const isNotFocus: (...styles: StyleCollection[]) => Rule;
export declare const isFocusVisible: (...styles: StyleCollection[]) => Rule;
export declare const isNotFocusVisible: (...styles: StyleCollection[]) => Rule;
export declare const isHover: (...styles: StyleCollection[]) => Rule;
export declare const isNotHover: (...styles: StyleCollection[]) => Rule;
export declare const isEmpty: (...styles: StyleCollection[]) => Rule;
export declare const isNotEmpty: (...styles: StyleCollection[]) => Rule;
export declare const combinators: (combinator: Combinator, selectors: SelectorCollection, styles: StyleCollection, options?: SelectorOptions) => Rule;
export declare const descendants: (selectors: SelectorCollection, styles: StyleCollection, options?: SelectorOptions) => Rule;
export declare const children: (selectors: SelectorCollection, styles: StyleCollection, options?: SelectorOptions) => Rule;
export declare const siblings: (selectors: SelectorCollection, styles: StyleCollection, options?: SelectorOptions) => Rule;
export declare const nextSiblings: (selectors: SelectorCollection, styles: StyleCollection, options?: SelectorOptions) => Rule;
export declare const iif: <T extends CssProps | Rule | Style>(condition: boolean, content: T) => T;
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
