import CH from 'create-history'
import BaseTypes from '../share/types'
import createApp from './createApp'

const CA = createApp

export default CA

declare namespace CA {
  interface Callback extends BaseTypes.Callback {}
  interface Listener extends BaseTypes.Listener {}
  interface CreateHistory extends BaseTypes.CreateHistory {}
  interface Settings extends BaseTypes.Settings {}
  interface Route extends BaseTypes.Route {}
  interface Loader extends BaseTypes.Loader {}
  interface Matcher extends BaseTypes.Matcher {}
  interface Matches extends BaseTypes.Matches {}
  interface Controller extends BaseTypes.Controller {}
  interface Location extends BaseTypes.Location {}
  interface Context extends BaseTypes.Context {}
  interface Cache<T> extends BaseTypes.Cache<T> {}
  interface AppMap<K, V> extends BaseTypes.AppMap<K, V> {}
  interface ControllerCacheFunc extends BaseTypes.ControllerCacheFunc {}
  interface ControllerConstructor extends BaseTypes.ControllerConstructor {}
  interface LoadController extends BaseTypes.LoadController {}
  interface WrapController extends BaseTypes.WrapController {}
  interface RenderTo<E> extends BaseTypes.RenderTo<E> {}
  interface ViewEngine extends BaseTypes.ViewEngine {}
  type CreateHistoryType = BaseTypes.CreateHistoryType

  interface CreateApp {
    (settings: Settings): App
  }

  interface Render {
    (targetPath: string | Location): any
  }

  interface Start {
    (
      callback?: Callback,
      shouldRenderWithCurrentLocation?: boolean
    ): () => void
  }
  
  interface Stop {
    (): void
  }

  interface Publish {
    (location: Location): void
  }

  interface App {
    start?: Start
    stop?: Stop
    render?: Render
    history?: CH.NativeHistory
    subscribe?: Subscribe
  }

  interface Subscribe {
    (listener: Listener): () => void
  }

  interface InitController {
    (
      c: ControllerConstructor | Promise<ControllerConstructor>
    ): HTMLElement | Element | string | number | boolean | null | undefined
  }

  interface CreateInitController {
    (location: Location): InitController
  }

  interface RenderToContainer<E = string> extends RenderTo<E> {
    (
      element: E,
      controller?: Controller
    ): Element
  }
  
  interface ClearContainer {
    (): void
  }
  
  interface DestoryContainer {
    (): void
  }

  interface GetContainer {
    (): Element
  }

  interface GetControllerByLocation {
    (location: Location): Controller
  }
  
  export interface ViewEngineRender<E> {
    (
      element: E,
      container: Element | null,
      controller?: Controller
    ): Element
  }
}