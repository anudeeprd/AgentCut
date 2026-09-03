import { useSyncExternalStore } from 'react';
import { editorStore, EditorState } from './editorStore';

export function useEditorStore(): EditorState {
  return useSyncExternalStore(
    editorStore.subscribe,
    editorStore.getState,
    editorStore.getState
  );
}

export function useImageProject() {
  const state = useEditorStore();
  return state.image;
}

export function useVideoProject() {
  const state = useEditorStore();
  return state.video;
}

export function useEditorMode() {
  const state = useEditorStore();
  return state.mode;
}

export function useAgentToasts() {
  const state = useEditorStore();
  return state.toasts;
}
