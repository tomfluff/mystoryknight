# OpenAI API
# GPT-5.6 family: terra is the strong/balanced tier, luna the fast/cheap one.
# These models reject `max_tokens` -- use `max_completion_tokens`.
MODEL_VISION = "gpt-5.6-terra"
MODEL_GPT4 = "gpt-5.6-terra"
MODEL_GPT3 = "gpt-5.6-luna"
MODEL_TTS = "gpt-4o-mini-tts"
MODEL_STT = "whisper-1"

# Image generation: two interchangeable providers, picked by IMAGE_GEN_PROVIDER.
# Both stay implemented and configured so either can be switched to at any
# time without code changes.
#   "openai" -- gpt-image-2 via OpenAI's images.generate / images.edit.
#   "gemini" -- gemini-3.1-flash-lite-image via Google's generateContent REST
#     call (the same endpoint shape every Gemini model uses -- verified live;
#     an earlier version of this pointed at a fictional /v1beta/interactions
#     endpoint that 403s).
IMAGE_GEN_PROVIDER = "gemini"

# -- openai provider --
# Takes no input_fidelity param, and measured ~23-32s at low quality on edits
# -- 70s at medium, so do NOT use medium.
# Alternatives, all measured on edits with a reference image:
#   gpt-image-1-mini: fastest/cheapest, ~12-13s at low, ~$0.006/image. Rejects
#     input_fidelity too -- keep it empty or the API 400s.
#   gpt-image-1.5 + fidelity=high: ~15-19s, ~$0.05 low / ~$0.08 medium
MODEL_IMAGE_GEN_OPENAI = "gpt-image-2"
# Only sent when non-empty, and only on the edits (reference image) path.
# Values: high | low (gpt-image-1 / 1.5 only).
# "low" on purpose: high preserves the WHOLE input image (composition,
# background, layout) and made every illustration look like the input. We only
# want the character kept; scene freedom comes from the prompt.
IMAGE_GEN_INPUT_FIDELITY = ""  # image-2 rejects the param entirely
# gpt-image-* supports 1024x1024, 1024x1536, 1536x1024 or "auto" -- not 256x256.
# It always returns base64, never a URL. Quality: low | medium | high | auto.
IMAGE_GEN_RESOLUTION_OPENAI = "1024x1024"
# "low" measured ~20-25% faster and half the cost of "medium" (output tokens
# 1400 -> 460); bump back to "medium" if low looks too rough in the story panel.
IMAGE_GEN_QUALITY_OPENAI = "low"

# -- gemini provider --
# Auth'd with GEMINI_API_KEY (see .env.example). Docs for this tier warn it
# is NOT optimized for multiple reference inputs -- we still send two (the
# child's drawing + the previous illustration) for character consistency,
# same as the openai path; watch illustration quality and drop to a single
# reference if it degrades.
MODEL_IMAGE_GEN_GEMINI = "gemini-3.1-flash-lite-image"
# Sent as generationConfig.imageConfig.aspectRatio. There is no separate
# pixel-size field -- the model picks its own native resolution per aspect
# ratio (1:1 measured as a real 1024x1024 JPEG).
IMAGE_GEN_ASPECT_RATIO_GEMINI = "1:1"

# Downscale before serving -- 1024px-class output is far larger than the
# story panel ever displays. Applies to either provider.
IMAGE_STORE_MAX_SIZE = 512

# How illustrations reach the client:
#   "inline" -- a WebP data URL, nothing stored server-side. No bucket, no disk.
#               The client holds the bytes and sends the previous one back for
#               the reference chain.
#   "url"    -- stored (GCS_BUCKET if set, else ./static) and served by URL.
IMAGE_DELIVERY = "inline"

# Only used by "inline". Smaller and WebP on purpose: the client keeps every
# image in sessionStorage (~5MB cap), and 512px PNG data URLs are ~756KB each,
# which blows the quota around part 7. WebP at 448px is ~15x smaller.
IMAGE_INLINE_MAX_SIZE = 448
IMAGE_INLINE_QUALITY = 80

# Reasoning effort for GPT-5.6 calls: none | low | medium | high.
# These prompts are short and consume ~0 reasoning tokens, so this is mostly
# insurance against slow, expensive reasoning on longer inputs.
LLM_REASONING_EFFORT = "low"

# App settings
APP_IMAGE_EXT = ["jpg", "jpeg", "png"]
PREMISE_GEN_COUNT = 3
ACTION_GEN_COUNT = 2

# Story memory / arc control
STORY_RECENT_WINDOW = 3  # parts kept verbatim; older parts fold into summary
STORY_TARGET_MIN = 6  # planned story length, chosen once at /story/init
STORY_TARGET_MAX = 10
MAX_SUMMARY_CHARS = 1500  # past this, one luna call compacts the summary

# LLM settings
LLM_DEBUG = True

# General settings
LOG_FOLDER = "logs"
