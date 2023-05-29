import { For, createSignal } from "solid-js";
import { usePost } from "./context/post";
import PostComponent from "./post";
import { PostApi } from "~/api";

const PostsContainerComponent = () => {
  const [posts, setPosts] = usePost();
  const [showModal, setShowModal] = createSignal(false);
  const [modalContent, setModalContent] = createSignal("");

  const handleAddPost = async () => {
    const sendPost = (async () => {
      await new PostApi().postControllerCreatePost({
        createPostDTO: { content: modalContent(), contentType: "TEXT" },
      });
      setModalContent("");
      setPosts(await new PostApi().postControllerGetPosts());
    })();
    setShowModal(false);
    await sendPost;
  };

  return (
    <>
      <div class="flex flex-col justify-center items-center">
        <For each={posts}>{(post) => <PostComponent post={post} />}</For>
      </div>
      <div class="w-full sticky bottom-0 flex flex-row-reverse">
        <div class="btn btn-circle m-10" onClick={() => setShowModal(true)}>
          +
        </div>
      </div>
      <div
        class={`modal modal-bottom sm:modal-middle ${
          showModal() ? "modal-open" : ""
        }`}
      >
        <div class="modal-box">
          <h3 class="font-bold text-lg m-5">Create Post</h3>
          <textarea
            placeholder="Content"
            onInput={(e) => setModalContent(e.target.value)}
            class="input w-full"
          />
          <div class="modal-action">
            <label class="btn btn-error" onClick={() => setShowModal(false)}>
              Cancel
            </label>
            <label class="btn btn-primary" onClick={handleAddPost}>
              Create
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostsContainerComponent;
