import {
  Component,
  ComponentProps,
  JSXElement,
  Signal,
  createContext,
  createSignal,
  useContext,
} from "solid-js";
import { SetStoreFunction, createStore } from "solid-js/store";
import { PostResponseDTO, UserResponseDTO } from "~/api";

const PostContext =
  createContext<[PostResponseDTO[], SetStoreFunction<PostResponseDTO[]>]>();

export const PostProvider: Component<{
  children?: JSXElement;
  initial: PostResponseDTO[];
}> = (props) => {
  const store = createStore<PostResponseDTO[]>(props.initial);

  return (
    <PostContext.Provider value={store}>{props.children}</PostContext.Provider>
  );
};

export const usePost = () => {
  return useContext(PostContext);
};
