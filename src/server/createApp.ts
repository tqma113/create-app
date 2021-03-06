/**
 * createApp at server
 */
import { useBasename, useQueries, createMemoryHistory } from "create-history";
import createMatcher from "../share/createMatcher";
import defaultAppSettings from "./defaultSettings";
import createController from "./createController";
import { createMap, ReqError, isPromise } from "../share/util";
import type { History, CreateHistory, LocationTypeMap } from "create-history";
import type {
  App,
  Route,
  Loader,
  Matcher,
  Context,
  Callback,
  Settings,
  EntireSettings,
  HistoryLocation,
  ServerController,
  InitControllerReturn,
  ControllerConstructor,
  ServerControllerConstructor,
} from "./index";

export function createHistory(
  settings?: EntireSettings
): History<
  LocationTypeMap["QUERY"]["Base"],
  LocationTypeMap["QUERY"]["Intact"]
> {
  const finalContext: Context = Object.assign(
    {},
    defaultAppSettings.context,
    settings?.context
  );
  const finalAppSettings: EntireSettings = Object.assign(
    {},
    defaultAppSettings,
    settings,
    { context: finalContext }
  );

  let chInit: CreateHistory<"NORMAL"> = createMemoryHistory;
  return useQueries(chInit)(finalAppSettings);
}

export function createHistoryWithBasename(
  settings?: EntireSettings
): History<LocationTypeMap["BQ"]["Base"], LocationTypeMap["BQ"]["Intact"]> {
  const finalContext: Context = Object.assign(
    {},
    defaultAppSettings.context,
    settings?.context
  );
  const finalAppSettings: EntireSettings = Object.assign(
    {},
    defaultAppSettings,
    settings,
    { context: finalContext }
  );

  let chInit: CreateHistory<"NORMAL"> = createMemoryHistory;
  return useQueries(useBasename(chInit))(finalAppSettings);
}

export default function createApp(settings: Settings): App {
  const finalContext: Context = Object.assign(
    {},
    defaultAppSettings.context,
    settings.context
  );
  const finalAppSettings: EntireSettings = Object.assign(
    {},
    defaultAppSettings,
    settings,
    { context: finalContext }
  );

  const { routes, viewEngine, loader, context } = finalAppSettings;

  let matcher = createMatcher(routes || []);
  let history = finalAppSettings.basename
    ? createHistoryWithBasename(finalAppSettings)
    : createHistory(finalAppSettings);

  function render(
    requestPath: string
  ): InitControllerReturn | Promise<InitControllerReturn>;
  function render(
    requestPath: string,
    injectContext: Context | null
  ): InitControllerReturn | Promise<InitControllerReturn>;
  function render(
    requestPath: string,
    callback: Callback
  ): InitControllerReturn | Promise<InitControllerReturn>;
  function render(
    requestPath: string,
    injectContext: Context | null,
    callback: Callback
  ): InitControllerReturn | Promise<InitControllerReturn>;
  function render(
    requestPath: string,
    injectContext?: Context | null | Callback,
    callback?: Callback
  ): InitControllerReturn | Promise<InitControllerReturn> {
    let result:
      | InitControllerReturn
      | Promise<InitControllerReturn>
      | null = null;

    if (typeof injectContext === "function") {
      callback = injectContext;
      injectContext = null;
    }

    try {
      let controller = fetchController(requestPath, injectContext);
      if (isPromise(controller)) {
        result = (<Promise<ServerController>>controller).then(initController);
      } else {
        result = initController(controller as ServerController);
      }
    } catch (error) {
      callback && callback(error);
      return Promise.reject(error);
    }
    if (isPromise(result)) {
      if (callback) {
        let cb: Function = callback;
        result.then(
          (result) => cb(null, result),
          (reason) => cb(reason)
        );
      }
      return result;
    }
    callback && callback(null, result);
    return result;
  }

  function initController(
    controller: ServerController
  ): InitControllerReturn | Promise<InitControllerReturn> {
    let component = controller.init();

    if (component === null) {
      return { controller: controller };
    }
    if (isPromise(component)) {
      return (component as Promise<unknown>).then((component) => {
        if (component == null) {
          return { controller: controller };
        }
        return {
          content: renderToString(component, controller),
          controller: controller,
        };
      });
    }
    return {
      content: renderToString(component, controller),
      controller: controller,
    };
  }

  function fetchController(
    requestPath: string,
    injectContext?: Context | null
  ): ServerController | Promise<ServerController> {
    let location = history.createLocation(requestPath);
    let matches = matcher(location.pathname);

    if (!matches) {
      let error = new ReqError(
        `Did not match any route with path:${requestPath}`,
        404
      );
      return Promise.reject(error);
    }

    let { path, params, controller } = matches;

    let finalLocation: HistoryLocation = Object.assign(
      {
        pattern: path,
        params,
        raw: location.pathname + location.search,
        basename: "",
      },
      location
    );

    let finalContext: Context = {
      ...context,
      ...injectContext,
    };
    let iController:
      | ControllerConstructor
      | Promise<ControllerConstructor> = loader(
      controller,
      finalLocation,
      finalContext
    );

    if (isPromise(iController)) {
      return (<Promise<ControllerConstructor>>iController).then(
        (iController) => {
          let Wrapper = wrapController(iController);
          return createController(Wrapper, finalLocation, finalContext);
        }
      );
    }

    let Wrapper = wrapController(<ControllerConstructor>iController);
    return createController(Wrapper, finalLocation, finalContext);
  }

  let controllers = createMap<
    ControllerConstructor,
    ServerControllerConstructor
  >();

  function wrapController(
    iController: ControllerConstructor
  ): ServerControllerConstructor {
    if (controllers.has(iController)) {
      return controllers.get(iController) as ServerControllerConstructor;
    }

    // implement the controller's life-cycle and useful methods
    class WrapperController extends iController {
      location: HistoryLocation;
      context: Context;
      matcher: Matcher;
      loader: Loader;
      routes: Route[];
      constructor(location: HistoryLocation, context: Context) {
        super(location, context);
        this.location = location;
        this.context = context;
        this.matcher = matcher;
        this.loader = loader;
        this.routes = routes || [];
      }
    }

    controllers.set(iController, WrapperController);
    return WrapperController;
  }

  function renderToString(element: unknown): unknown;
  function renderToString(
    element: unknown,
    controller: ServerController
  ): unknown;
  function renderToString(
    element: unknown,
    controller?: ServerController
  ): unknown {
    if (!viewEngine) {
      return null;
    }

    if (controller) {
      return viewEngine.render(element, controller);
    } else {
      return viewEngine.render(element);
    }
  }

  return {
    render,
    history,
  };
}
