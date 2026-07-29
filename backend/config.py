# OpenAI API
# GPT-5.6 family: terra is the strong/balanced tier, luna the fast/cheap one.
# These models reject `max_tokens` -- use `max_completion_tokens`.
MODEL_VISION = "gpt-5.6-terra"
MODEL_GPT4 = "gpt-5.6-terra"
MODEL_GPT3 = "gpt-5.6-luna"
# gpt-image-1-mini: fastest/cheapest tier (measured ~12-13s at low on edits,
# ~$0.006/image). Does not support input_fidelity -- keep it empty or the API
# 400s. Alternatives, all measured on edits with a reference image:
#   gpt-image-1.5 + fidelity=high: ~15-19s, ~$0.05 low / ~$0.08 medium
#   gpt-image-2 (no fidelity param): ~23-32s low, 70s medium (do NOT use medium)
MODEL_IMAGE_GEN = "gpt-image-2"
# Only sent when non-empty, and only on the edits (reference image) path.
# Values: high | low (gpt-image-1 / 1.5 only).
# "low" on purpose: high preserves the WHOLE input image (composition,
# background, layout) and made every illustration look like the input. We only
# want the character kept; scene freedom comes from the prompt.
IMAGE_GEN_INPUT_FIDELITY = ""  # image-2 rejects the param entirely
MODEL_TTS = "gpt-4o-mini-tts"
MODEL_STT = "whisper-1"
# gpt-image-* supports 1024x1024, 1024x1536, 1536x1024 or "auto" -- not 256x256.
# It always returns base64, never a URL. Quality: low | medium | high | auto.
IMAGE_GEN_RESOLUTION = "1024x1024"
# "low" measured ~20-25% faster and half the cost of "medium" (output tokens
# 1400 -> 460); bump back to "medium" if low looks too rough in the story panel.
IMAGE_GEN_QUALITY = "low"
# Downscale before serving -- 1024px is the smallest the model emits, but the
# story panel never displays it that large.
IMAGE_STORE_MAX_SIZE = 512

# Reasoning effort for GPT-5.6 calls: none | low | medium | high.
# These prompts are short and consume ~0 reasoning tokens, so this is mostly
# insurance against slow, expensive reasoning on longer inputs.
LLM_REASONING_EFFORT = "low"

# App settings
APP_IMAGE_EXT = ["jpg", "jpeg", "png"]
FLASK_DEBUG = True
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
