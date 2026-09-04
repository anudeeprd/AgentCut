import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VideoTimeline } from '../components/video/VideoTimeline';
import { editorStore } from '../store/editorStore';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';

describe('Multi-Track Timeline UX Suite (One Track Per Text Layer)', () => {
  beforeEach(() => {
    editorStore.resetAll();
    editorStore.setMode('video');
    editorStore.loadVideo({
      fileName: 'sample-video.mp4',
      duration: 10.0,
      width: 1280,
      height: 720,
      objectUrl: 'blob:sample-video',
    });
  });

  it('1. zero text layers → only video track is rendered', () => {
    const handleSelectTextId = vi.fn();
    const { container } = render(
      <VideoTimeline selectedTextId={null} onSelectTextId={handleSelectTextId} />
    );

    // Video track header and lane must exist
    expect(screen.getByTestId('timeline-track-header-video')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-track-lane-video')).toBeInTheDocument();

    // No text track lanes or headers should exist
    const textTrackHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    const textTrackLanes = container.querySelectorAll(
      '[data-testid^="timeline-track-lane-"]:not([data-testid="timeline-track-lane-video"])'
    );
    expect(textTrackHeaders).toHaveLength(0);
    expect(textTrackLanes).toHaveLength(0);
  });

  it('2. one text layer → one text timeline row', () => {
    const layerId = editorStore.addVideoText({
      content: 'Welcome to',
      startTime: 2.0,
      endTime: 6.0,
    });

    const handleSelectTextId = vi.fn();
    const { container } = render(
      <VideoTimeline selectedTextId={null} onSelectTextId={handleSelectTextId} />
    );

    const header = screen.getByTestId(`timeline-track-header-${layerId}`);
    const lane = screen.getByTestId(`timeline-track-lane-${layerId}`);
    const bar = screen.getByTestId(`timeline-timing-bar-${layerId}`);

    expect(header).toBeInTheDocument();
    expect(lane).toBeInTheDocument();
    expect(bar).toBeInTheDocument();
    expect(header).toHaveTextContent('Welcome to');

    const allTextHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    expect(allTextHeaders).toHaveLength(1);
  });

  it('3. two text layers → two distinct rows', () => {
    const layer1 = editorStore.addVideoText({
      content: 'Welcome to',
      startTime: 2.0,
      endTime: 6.0,
    });
    const layer2 = editorStore.addVideoText({
      content: 'Indonesia',
      startTime: 2.0,
      endTime: 6.0,
    });

    const handleSelectTextId = vi.fn();
    const { container } = render(
      <VideoTimeline selectedTextId={null} onSelectTextId={handleSelectTextId} />
    );

    expect(screen.getByTestId(`timeline-track-header-${layer1}`)).toHaveTextContent('Welcome to');
    expect(screen.getByTestId(`timeline-track-header-${layer2}`)).toHaveTextContent('Indonesia');
    expect(screen.getByTestId(`timeline-track-lane-${layer1}`)).toBeInTheDocument();
    expect(screen.getByTestId(`timeline-track-lane-${layer2}`)).toBeInTheDocument();

    const allTextHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    expect(allTextHeaders).toHaveLength(2);
  });

  it('4. four text layers → four distinct rows', () => {
    const l1 = editorStore.addVideoText({ content: 'Welcome to', startTime: 2.0, endTime: 6.0 });
    const l2 = editorStore.addVideoText({ content: 'Indonesia', startTime: 2.0, endTime: 6.0 });
    const l3 = editorStore.addVideoText({ content: 'Explore More', startTime: 4.0, endTime: 8.0 });
    const l4 = editorStore.addVideoText({ content: 'Summer 2026', startTime: 1.0, endTime: 5.0 });

    const handleSelectTextId = vi.fn();
    const { container } = render(
      <VideoTimeline selectedTextId={null} onSelectTextId={handleSelectTextId} />
    );

    expect(screen.getByTestId(`timeline-track-header-${l1}`)).toHaveTextContent('Welcome to');
    expect(screen.getByTestId(`timeline-track-header-${l2}`)).toHaveTextContent('Indonesia');
    expect(screen.getByTestId(`timeline-track-header-${l3}`)).toHaveTextContent('Explore More');
    expect(screen.getByTestId(`timeline-track-header-${l4}`)).toHaveTextContent('Summer 2026');

    const allTextHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    expect(allTextHeaders).toHaveLength(4);

    const allTextLanes = container.querySelectorAll(
      '[data-testid^="timeline-track-lane-"]:not([data-testid="timeline-track-lane-video"])'
    );
    expect(allTextLanes).toHaveLength(4);
  });

  it('5. track label uses text content and falls back to "Untitled Text" when empty', () => {
    const namedLayer = editorStore.addVideoText({ content: 'Grand Opening', startTime: 0, endTime: 5 });
    const emptyLayer = editorStore.addVideoText({ content: '   ', startTime: 1, endTime: 4 });

    render(<VideoTimeline selectedTextId={null} onSelectTextId={vi.fn()} />);

    expect(screen.getByTestId(`timeline-track-header-${namedLayer}`)).toHaveTextContent('Grand Opening');
    expect(screen.getByTestId(`timeline-track-header-${emptyLayer}`)).toHaveTextContent('Untitled Text');
  });

  it('6. long content truncates visually without changing stored text', () => {
    const longContent = 'A very long headline that exceeds ordinary timeline width and needs ellipsis';
    const layerId = editorStore.addVideoText({
      content: longContent,
      startTime: 1,
      endTime: 5,
    });

    render(<VideoTimeline selectedTextId={null} onSelectTextId={vi.fn()} />);

    // Stored content is not mutated
    const stored = editorStore.getState().video.textLayers.find((l) => l.id === layerId);
    expect(stored?.content).toBe(longContent);

    // Track header label preserves tooltip title with full string and uses truncate class
    const header = screen.getByTestId(`timeline-track-header-${layerId}`);
    expect(header).toHaveAttribute('title', longContent);
    const textSpan = header.querySelector('span');
    expect(textSpan).toHaveClass('truncate');
  });

  it('7. selecting a timeline text row or timing bar selects correct textId', () => {
    const l1 = editorStore.addVideoText({ content: 'First', startTime: 0, endTime: 4 });
    const l2 = editorStore.addVideoText({ content: 'Second', startTime: 2, endTime: 6 });

    let selectedId: string | null = null;
    const handleSelectTextId = vi.fn((id: string | null) => {
      selectedId = id;
    });

    const { rerender } = render(
      <VideoTimeline selectedTextId={selectedId} onSelectTextId={handleSelectTextId} />
    );

    // Click track header for layer 2
    fireEvent.click(screen.getByTestId(`timeline-track-header-${l2}`));
    expect(handleSelectTextId).toHaveBeenCalledWith(l2);

    rerender(<VideoTimeline selectedTextId={l2} onSelectTextId={handleSelectTextId} />);
    const header2 = screen.getByTestId(`timeline-track-header-${l2}`);
    expect(header2).toHaveClass('bg-[#FFF5D6]');

    // Click timing bar for layer 1
    fireEvent.click(screen.getByTestId(`timeline-timing-bar-${l1}`));
    expect(handleSelectTextId).toHaveBeenCalledWith(l1);
  });

  it('8. each text row only shows its own keyframes', () => {
    const l1 = editorStore.addVideoText({ content: 'Welcome to', startTime: 2, endTime: 6 });
    const l2 = editorStore.addVideoText({ content: 'Indonesia', startTime: 2, endTime: 6 });

    const kf1 = editorStore.addVideoKeyframe({
      targetType: 'text',
      targetId: l1,
      time: 3.0,
      properties: { scale: 1.2 },
    });

    const kf2 = editorStore.addVideoKeyframe({
      targetType: 'text',
      targetId: l2,
      time: 5.0,
      properties: { opacity: 0.5 },
    });

    render(<VideoTimeline selectedTextId={null} onSelectTextId={vi.fn()} />);

    const lane1 = screen.getByTestId(`timeline-track-lane-${l1}`);
    const lane2 = screen.getByTestId(`timeline-track-lane-${l2}`);

    // kf1 should be inside lane1 and NOT lane2
    expect(lane1.querySelector(`[data-testid="timeline-keyframe-${kf1}"]`)).not.toBeNull();
    expect(lane2.querySelector(`[data-testid="timeline-keyframe-${kf1}"]`)).toBeNull();

    // kf2 should be inside lane2 and NOT lane1
    expect(lane2.querySelector(`[data-testid="timeline-keyframe-${kf2}"]`)).not.toBeNull();
    expect(lane1.querySelector(`[data-testid="timeline-keyframe-${kf2}"]`)).toBeNull();
  });

  it('9. deleting one text layer removes only its row', () => {
    const l1 = editorStore.addVideoText({ content: 'Welcome to', startTime: 2, endTime: 6 });
    const l2 = editorStore.addVideoText({ content: 'Indonesia', startTime: 2, endTime: 6 });
    const l3 = editorStore.addVideoText({ content: 'Explore More', startTime: 4, endTime: 8 });

    const { container, rerender } = render(
      <VideoTimeline selectedTextId={null} onSelectTextId={vi.fn()} />
    );

    const initialHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    expect(initialHeaders).toHaveLength(3);

    // Delete Explore More (l3)
    act(() => {
      editorStore.removeVideoText(l3);
    });

    rerender(<VideoTimeline selectedTextId={null} onSelectTextId={vi.fn()} />);

    expect(screen.getByTestId(`timeline-track-header-${l1}`)).toBeInTheDocument();
    expect(screen.getByTestId(`timeline-track-header-${l2}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`timeline-track-header-${l3}`)).not.toBeInTheDocument();

    const remainingHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    expect(remainingHeaders).toHaveLength(2);
  });

  it('10. adding a text layer reactively creates a new row', () => {
    const { container, rerender } = render(
      <VideoTimeline selectedTextId={null} onSelectTextId={vi.fn()} />
    );

    const initialHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    expect(initialHeaders).toHaveLength(0);

    let l1 = '';
    act(() => {
      l1 = editorStore.addVideoText({ content: 'New Layer', startTime: 0, endTime: 3 });
    });

    rerender(<VideoTimeline selectedTextId={null} onSelectTextId={vi.fn()} />);

    expect(screen.getByTestId(`timeline-track-header-${l1}`)).toBeInTheDocument();

    const updatedHeaders = container.querySelectorAll(
      '[data-testid^="timeline-track-header-"]:not([data-testid="timeline-track-header-video"])'
    );
    expect(updatedHeaders).toHaveLength(1);
  });

  it('11. WebMCP tool count remains exactly 29', () => {
    const tools = getAgentCutToolDefinitions();
    expect(tools).toHaveLength(29);

    const imageTools = tools.filter((t) => t.name.includes('image'));
    const videoTools = tools.filter((t) => t.name.includes('video') || t.name === 'get_timeline');
    expect(imageTools).toHaveLength(11);
    expect(videoTools).toHaveLength(18);
  });
});
