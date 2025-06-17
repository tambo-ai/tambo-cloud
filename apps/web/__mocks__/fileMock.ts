/**
 * Generic file mock for Jest.
 *
 * The default export is an empty string so that importing the asset
 * gives you a usable value in string position (`<img src={logo} />`).
 *
 * For SVGs bundled via @svgr/webpack it is also common to import
 * the component variant:
 *
 *   import { ReactComponent as Logo } from "./logo.svg";
 *
 * To support that style we add a named `ReactComponent` export that
 * renders nothing.
 */

const stub = "test-file-stub";

export const ReactComponent: React.FC = () => null;
ReactComponent.displayName = "SvgMock";

export default stub;
