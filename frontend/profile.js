
const API_URL = "http://127.0.0.1:8000";

const token = sessionStorage.getItem("access_token");

const profileForm = document.getElementById("profile-form");
const profileMessage = document.getElementById("profile-message");
const saveButton = document.getElementById("save-profile-btn");


if (!token) {
    window.location.href = "index.html";
}


// Fetch Existing Profile
async function loadProfile() {

    try {

        const response = await fetch(API_URL + "/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 401) {
            sessionStorage.removeItem("access_token");
            window.location.href = "index.html";
            return;
        }

        if (!response.ok) {
            throw new Error(data.detail || "Unable to fetch profile");
        }

        if (data.profile_completed === true) {

            document.getElementById("full-name").value = data.full_name;
            document.getElementById("phone-number").value = data.phone_number;
            document.getElementById("date-of-birth").value = data.date_of_birth;
            document.getElementById("gender").value = data.gender;
            document.getElementById("address").value = data.address;

            saveButton.textContent = "Update Profile";
        }

    } catch (error) {

        profileMessage.textContent = error.message;
        profileMessage.style.color = "red";

    }
}


// Submit or Update Profile
profileForm.addEventListener("submit", async function(event) {

    event.preventDefault();

    const profileData = {
        full_name: document.getElementById("full-name").value.trim(),
        phone_number: document.getElementById("phone-number").value.trim(),
        date_of_birth: document.getElementById("date-of-birth").value,
        gender: document.getElementById("gender").value,
        address: document.getElementById("address").value.trim()
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {

        const response = await fetch(API_URL + "/profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (response.status === 401) {
            sessionStorage.removeItem("access_token");
            window.location.href = "index.html";
            return;
        }

        if (!response.ok) {
            throw new Error(data.detail || "Unable to save profile");
        }

        profileMessage.textContent = "Profile updated successfully!";
        profileMessage.style.color = "green";

        await loadProfile();

    } catch (error) {

        profileMessage.textContent = error.message;
        profileMessage.style.color = "red";

    } finally {

        saveButton.disabled = false;
        saveButton.textContent = "Update Profile";

    }

});


// Load profile when page opens
loadProfile();
