import { For, onMount } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { Configuration } from "~/api";
import { DefaultConfig } from "~/api";
import { PostApi } from "~/api";
import HeaderComponent from "~/components/header";
import { MeProvider } from "~/components/me";
import PostComponent from "~/components/post";

const TestComponent = () => {
  const items = useRouteData<typeof routeData>();

  onMount(async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken != null) {
      DefaultConfig.config = new Configuration({ accessToken });
    }
  });

  return (
    <MeProvider>
      <HeaderComponent />
      <div class="flex flex-col justify-center items-center">
        <For each={items()}>{(post) => <PostComponent post={post} />}</For>
      </div>
    </MeProvider>
  );
};

export const routeData = () =>
  createServerData$(() => {
    return new PostApi().postControllerGetPosts();
  });

export default TestComponent;
