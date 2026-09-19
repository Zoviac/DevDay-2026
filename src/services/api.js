const API_URL = "http://localhost:8000";

export function getUserId() {
  let userId = localStorage.getItem("devday-user-id");
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("devday-user-id", userId);
  }
  return userId;
}

export async function getFavoritesRequest(userId) {
  const response = await fetch(`${API_URL}/favorites/${encodeURIComponent(userId)}`);

  if (!response.ok) {
    throw new Error("Failed to load favorites");
  }

  const data = await response.json();
  return data.favorites;
}

export async function toggleFavoriteRequest(userId, recipe) {
  const response = await fetch(
    `${API_URL}/favorites/toggle`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        food: recipe,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update favorites");
  }

  const data = await response.json();

  return data.favorites;
}

export async function sendVoiceRecording(audioBlob) {
  const formData = new FormData();
  const extension = audioBlob.type.includes("mp4")
    ? "mp4"
    : audioBlob.type.includes("ogg")
      ? "ogg"
      : "webm";
  formData.append("file", audioBlob, `recording.${extension}`);
  const response = await fetch(
    `${API_URL}/chef/voice/audio`,
    {
      method: "POST",
      body: formData,
    }
  );
  if (!response.ok) {
    let detail = "Voice request failed";
    try {
      const data = await response.json();
      if (data.detail) detail = data.detail;
    } catch {
      // Keep the generic message when the server does not return JSON.
    }
    throw new Error(detail);
  }
  return response.blob();
}
