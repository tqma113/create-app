import { History, LocationTypeMap } from 'create-history'
import {
  Context,
  Callback,
  EntireSettings,
  Matcher,
  Loader,
  Route,
  HistoryLocation,
  HistoryBaseLocation,
  Controller
} from '../share/type'

export interface ServerController extends Controller {
  location: HistoryLocation
  context: Context
}

export interface ServerControllerConstructor {
  new(
    location: HistoryLocation,
    context: Context
  ): ServerController
}

export interface App {
  render: Render
  history: History<
    LocationTypeMap['BQ']['Base'],
    LocationTypeMap['BQ']['Intact']
  > | History<
    LocationTypeMap['QUERY']['Base'],
    LocationTypeMap['QUERY']['Intact']
  >
}

export interface Render {
  (
    requestPath: string
  ): InitControllerReturn | Promise<InitControllerReturn>
  (
    requestPath: string,
    injectContext: Partial<Context> | null
  ): InitControllerReturn | Promise<InitControllerReturn>
  (
    requestPath: string,
    callback: Callback
  ): InitControllerReturn | Promise<InitControllerReturn>
  (
    requestPath: string,
    injectContext: Partial<Context> | null,
    callback: Callback
  ): InitControllerReturn | Promise<InitControllerReturn>
  (
    requestPath: string,
    injectContext?: Partial<Context> | null | Callback,
    callback?: Callback
  ): InitControllerReturn | Promise<InitControllerReturn>
}

interface InitControllerReturn {
  content?: unknown
  controller: Controller
}