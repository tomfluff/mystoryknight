"""Pure state math for the story memory system.

The backend is stateless: the client carries StoryState with every request and
the server advances it as a pure function (state, state_update) -> state'.
Nothing here calls a model -- compaction in the normal path is concatenation of
recaps that were written when their parts were generated.
"""

import random

from config import (
    STORY_RECENT_WINDOW,
    STORY_TARGET_MIN,
    STORY_TARGET_MAX,
    MAX_SUMMARY_CHARS,
)

MAX_ENTITIES = 12
MAX_THREADS = 5


def compute_phase(index, target):
    # Steers the NEXT part, hence index + 1.
    r = (index + 1) / target
    if r < 0.7:
        return "rising"
    if r < 1.0:
        return "climax"
    return "resolution"


def initial_state(state_update, part_text):
    """State after the opening part, from the model's piggybacked update."""
    target = random.randint(STORY_TARGET_MIN, STORY_TARGET_MAX)
    return {
        "summary": "",
        "recentParts": [
            {"text": part_text, "recap": state_update.get("recap", "")}
        ],
        "entities": (state_update.get("entities") or [])[:MAX_ENTITIES],
        "openThreads": (state_update.get("open_threads") or [])[:MAX_THREADS],
        "beat": {"index": 1, "target": target, "phase": compute_phase(1, target)},
    }


def degenerate_from_blob(story_text):
    """Fallback for legacy sessions that only have the joined prose blob.

    Self-heals: the next /story/part piggyback regenerates entities and threads
    from summary + recent parts, and the returned state replaces this one.
    """
    return {
        "summary": story_text or "",
        "recentParts": [],
        "entities": [],
        "openThreads": [],
        "beat": {"index": 1, "target": STORY_TARGET_MAX, "phase": "rising"},
    }


def advance_state(state, part_text, state_update):
    """Advance after a generated part. Returns a new dict; input not mutated."""
    recent = list(state.get("recentParts") or [])
    recent.append({"text": part_text, "recap": state_update.get("recap", "")})

    summary = state.get("summary") or ""
    while len(recent) > STORY_RECENT_WINDOW:
        folded = recent.pop(0)
        recap = folded.get("recap") or folded.get("text") or ""
        summary = f"{summary} {recap}".strip()

    beat = dict(state.get("beat") or {})
    index = int(beat.get("index") or 0) + 1
    target = int(beat.get("target") or STORY_TARGET_MAX)

    return {
        "summary": summary,
        "recentParts": recent,
        "entities": (state_update.get("entities") or [])[:MAX_ENTITIES],
        "openThreads": (state_update.get("open_threads") or [])[:MAX_THREADS],
        "beat": {"index": index, "target": target, "phase": compute_phase(index, target)},
    }


def needs_compaction(state):
    return len(state.get("summary") or "") > MAX_SUMMARY_CHARS


def prompt_fields(state):
    """The subset of state the model actually sees, with wire-friendly names."""
    return {
        "summary": state.get("summary") or "",
        "recent_parts": [p.get("text", "") for p in state.get("recentParts") or []],
        "entities": state.get("entities") or [],
        "open_threads": state.get("openThreads") or [],
        "phase": (state.get("beat") or {}).get("phase", "rising"),
    }


if __name__ == "__main__":
    # Self-check: window fold, phase boundaries, bounds.
    upd = lambda i: {"recap": f"r{i}.", "entities": [], "open_threads": []}
    s = initial_state({"recap": "r1.", "entities": [{"name": "A", "kind": "character", "note": "x"}], "open_threads": ["t"]}, "opening text")
    assert s["recentParts"][0]["text"] == "opening text"
    assert s["beat"]["index"] == 1 and s["entities"][0]["name"] == "A"
    for i in range(2, 8):
        s = advance_state(s, f"part {i} text", upd(i))
    assert len(s["recentParts"]) == STORY_RECENT_WINDOW
    assert s["summary"].startswith("r1.") and "r4." in s["summary"] and "r5." not in s["summary"]
    assert s["beat"]["index"] == 7
    assert compute_phase(1, 8) == "rising" and compute_phase(5, 8) == "climax"
    assert compute_phase(8, 8) == "resolution" and compute_phase(20, 8) == "resolution"
    big = {"summary": "x" * (MAX_SUMMARY_CHARS + 1), "recentParts": [], "entities": [], "openThreads": [], "beat": {}}
    assert needs_compaction(big) and not needs_compaction(s)
    print("story_state self-check OK")
