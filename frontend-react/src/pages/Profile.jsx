import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function Profile() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("access_token");

  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    full_name: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);

  const [profilePicture, setProfilePicture] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [pictureUrl, setPictureUrl] = useState("");
  const [pictureLoading, setPictureLoading] = useState(false);
  const [pictureFetching, setPictureFetching] = useState(true);
  const [pictureMessage, setPictureMessage] = useState("");
  const [pictureMessageType, setPictureMessageType] = useState("");

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("session_id");
    sessionStorage.removeItem("expires_at");

    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      clearSession();
      return;
    }

    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (response.status === 401) {
          clearSession();
          return;
        }

        if (response.status === 404) {
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to retrieve profile");
        }

        const data = await response.json();

        setProfile({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          address: data.address || "",
        });

        setProfileCompleted(
          Boolean(
            data.full_name &&
            data.phone_number &&
            data.date_of_birth &&
            data.gender &&
            data.address
          )
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setMessage("Unable to load profile.");
          setMessageType("error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetching(false);
        }
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [token, clearSession]);

  const fetchProfilePicture = useCallback(
    async (signal) => {
      try {
        const response = await fetch(
          `${API_URL}/profile/picture`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal,
          }
        );

        if (response.status === 401) {
          clearSession();
          return false;
        }

        if (response.status === 404) {
          setProfilePicture(null);
          return true;
        }

        if (!response.ok) {
          throw new Error("Failed to retrieve profile picture");
        }

        const imageBlob = await response.blob();

        if (signal?.aborted) {
          return false;
        }

        setProfilePicture(imageBlob);
        return true;
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setPictureMessage("Unable to load profile picture.");
          setPictureMessageType("error");
        }

        return false;
      }
    },
    [token, clearSession]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    const loadPicture = async () => {
      await fetchProfilePicture(controller.signal);

      if (!controller.signal.aborted) {
        setPictureFetching(false);
      }
    };

    loadPicture();

    return () => controller.abort();
  }, [token, fetchProfilePicture]);

  useEffect(() => {
    if (!profilePicture) {
      setPictureUrl("");
      return;
    }

    const imageUrl = URL.createObjectURL(profilePicture);

    setPictureUrl(imageUrl);

    return () => URL.revokeObjectURL(imageUrl);
  }, [profilePicture]);

  useEffect(() => {
    if (!selectedFile) {
      setPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedFile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previousProfile) => ({
      ...previousProfile,
      [name]: value,
    }));
  };

  const handlePictureSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPictureMessage("");

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setPictureMessage("Only JPG, JPEG and PNG images are allowed.");
      setPictureMessageType("error");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPictureMessage("Profile picture must not exceed 2 MB.");
      setPictureMessageType("error");
      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setPictureMessage("Please select a valid image.");
      setPictureMessageType("error");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleCancelPicture = () => {
    setSelectedFile(null);
    setPictureMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) {
      setPictureMessage("Please select an image.");
      setPictureMessageType("error");
      return;
    }

    setPictureLoading(true);
    setPictureMessage("");

    const formData = new FormData();

    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        `${API_URL}/profile/picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        clearSession();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setPictureMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to upload profile picture."
        );

        setPictureMessageType("error");
        return;
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const pictureRetrieved = await fetchProfilePicture();

      if (pictureRetrieved) {
        setPictureMessage("Profile picture updated successfully!");
        setPictureMessageType("success");
      } else {
        setPictureMessage(
          "Picture saved, but unable to refresh the preview."
        );
        setPictureMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setPictureMessage("Unable to upload profile picture.");
      setPictureMessageType("error");
    } finally {
      setPictureLoading(false);
    }
  };

  const handleRemovePicture = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove your profile picture?"
    );

    if (!confirmed) {
      return;
    }

    setPictureLoading(true);
    setPictureMessage("");

    try {
      const response = await fetch(
        `${API_URL}/profile/picture`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        clearSession();
        return;
      }

      if (response.status === 404) {
        setProfilePicture(null);
        handleCancelPicture();
        setPictureMessage("No profile picture found.");
        setPictureMessageType("error");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setPictureMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to remove profile picture."
        );

        setPictureMessageType("error");
        return;
      }

      setProfilePicture(null);
      handleCancelPicture();

      setPictureMessage("Profile picture removed successfully!");
      setPictureMessageType("success");
    } catch (error) {
      console.error(error);
      setPictureMessage("Unable to remove profile picture.");
      setPictureMessageType("error");
    } finally {
      setPictureLoading(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.status === 401) {
        clearSession();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Failed to update profile."
        );

        setMessageType("error");
        return;
      }

      setMessage("Profile updated successfully!");
      setMessageType("success");
      setProfileCompleted(true);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the backend.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="auth-container">
      <h1>Product Management System</h1>

      <p className="subtitle">
        Manage your personal information.
      </p>

      <div className="auth-card profile-card">
        <h2>My Profile</h2>

        <div className="profile-picture-section">
          <div className="profile-picture-container">
            {preview || pictureUrl ? (
              <img
                src={preview || pictureUrl}
                alt="Profile"
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                <svg
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                </svg>
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png"
            ref={fileInputRef}
            onChange={handlePictureSelect}
            disabled={pictureLoading || pictureFetching}
            hidden
          />

          <div className="profile-picture-actions">
            <button
              type="button"
              className="picture-select-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pictureLoading || pictureFetching}
            >
              {profilePicture
                ? "Change Picture"
                : "Choose Picture"}
            </button>

            {selectedFile && (
              <>
                <button
                  type="button"
                  className="picture-upload-button"
                  onClick={handleUploadPicture}
                  disabled={pictureLoading}
                >
                  {pictureLoading ? "Uploading..." : "Upload"}
                </button>

                <button
                  type="button"
                  className="picture-cancel-button"
                  onClick={handleCancelPicture}
                  disabled={pictureLoading}
                >
                  Cancel
                </button>
              </>
            )}

            {profilePicture && !selectedFile && (
              <button
                type="button"
                className="picture-remove-button"
                onClick={handleRemovePicture}
                disabled={pictureLoading || pictureFetching}
              >
                {pictureLoading ? "Removing..." : "Remove"}
              </button>
            )}
          </div>

          <p className="picture-hint">
            JPG, JPEG or PNG | Maximum size: 2 MB
          </p>

          {pictureFetching && (
            <p className="picture-hint">
              Loading profile picture...
            </p>
          )}

          {pictureMessage && (
            <p className={`${pictureMessageType}-message`}>
              {pictureMessage}
            </p>
          )}
        </div>

        <form onSubmit={handleSave}>
          <label htmlFor="full-name">Full Name</label>

          <input
            id="full-name"
            type="text"
            name="full_name"
            placeholder="Enter your full name"
            value={profile.full_name}
            onChange={handleChange}
            required
          />

          <label htmlFor="phone-number">Phone Number</label>

          <input
            id="phone-number"
            type="tel"
            name="phone_number"
            placeholder="Enter your phone number"
            value={profile.phone_number}
            onChange={handleChange}
            required
          />

          <label htmlFor="date-of-birth">Date of Birth</label>

          <input
            id="date-of-birth"
            type="date"
            name="date_of_birth"
            value={profile.date_of_birth}
            onChange={handleChange}
            required
          />

          <label htmlFor="gender">Gender</label>

          <select
            id="gender"
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="address">Address</label>

          <textarea
            id="address"
            name="address"
            placeholder="Enter your address"
            value={profile.address}
            onChange={handleChange}
            rows={3}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>

        {message && (
          <p className={`${messageType}-message`}>
            {message}
          </p>
        )}

        {profileCompleted && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/dashboard")}
            disabled={pictureLoading || loading}
          >
            Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

export default Profile;