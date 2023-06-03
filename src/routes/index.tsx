import { For, onMount } from "solid-js";
import { useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { Configuration } from "~/api";
import { DefaultConfig } from "~/api";
import { PostApi } from "~/api";
import HeaderComponent from "~/components/header";
import { MeProvider } from "~/components/context/me";
import PostComponent from "~/components/post";
import PostsContainerComponent from "~/components/postsContainer";
import { PostProvider } from "~/components/context/post";

const NachoApp = () => {
  const items = useRouteData<typeof routeData>();

  onMount(async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken != null) {
      DefaultConfig.config = new Configuration({ accessToken });
    }
  });

  return (
    <MeProvider>
      <PostProvider initial={items()}>
        <HeaderComponent />
        <PostsContainerComponent />
      </PostProvider>
    </MeProvider>
  );
};

export const routeData = () =>
  createServerData$(() => {
    return new PostApi().postControllerGetPosts();
  });

export default NachoApp;
