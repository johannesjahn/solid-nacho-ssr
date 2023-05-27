import { Component, Show } from "solid-js";
import { BASE_PATH, PostResponseDTO } from "../api";

const PostComponent: Component<{ post: PostResponseDTO }> = ({ post }) => {
  return (
    <>
      <div class="card bg-base-200 shadow-xl m-5 postSize">
        <div class="card-body flex flex-col justify-center items-center">
          <Show when={post.contentType == "TEXT"}>
            <p class="contents">{post.content}</p>
          </Show>
          <Show when={post.contentType == "IMAGE_URL"}>
            <img class="postImage" src={post.content} />
          </Show>
        </div>
        <div class="flex flex-row items-center justify-end m-2">
          <div class="avatar">
            <div class="w-10 rounded-full">
              <img src={BASE_PATH + "/app/user/avatar/" + post.author.id}></img>
            </div>
          </div>
          <p class="text-xs m-2">
            {post.author.username}, {post.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>
    </>
  );
};

export default PostComponent;
