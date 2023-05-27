import { For, onMount } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { PostApi } from "~/api";
import HeaderComponent from "~/components/header";
import PostComponent from "~/components/post";

const TestComponent = () => {
  const items = useRouteData<typeof routeData>();

  onMount(async () => {
    const test = await new PostApi().postControllerGetComments({ postId: 0 });
    console.log(test);
  });

  return (
    <>
      <HeaderComponent />
      <div class="flex flex-col justify-center items-center">
        <For each={items()}>{(post) => <PostComponent post={post} />}</For>
      </div>
    </>
  );
};

export const routeData = () =>
  createServerData$(() => {
    return new PostApi().postControllerGetPosts();
  });

export default TestComponent;
