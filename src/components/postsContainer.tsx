import { For } from "solid-js";
import { usePost } from "./context/post";
import PostComponent from "./post";

const PostsContainerComponent = () => {
  const [posts, setPosts] = usePost();

  return (
    <>
      <div class="flex flex-col justify-center items-center">
        <For each={posts}>{(post) => <PostComponent post={post} />}</For>
      </div>
      <div class="w-full sticky bottom-0 flex flex-row-reverse">
        <div class="btn btn-circle m-10">+</div>
      </div>
    </>
  );
};

export default PostsContainerComponent;
