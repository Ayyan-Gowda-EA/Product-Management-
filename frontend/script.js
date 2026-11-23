
const authForm = document.getElementById("auth-form");
const formTitle = document.getElementById("form-title");
const nameField = document.getElementById("name-field");
const submitBtn = document.getElementById("submit-btn");
const toggleText = document.getElementById("toggle-text");
const message = document.getElementById("message");

let isRegister = false;

const API_URL = "http://127.0.0.1:8000";


toggleText.addEventListener("click", function (event) {

    if (event.target.id !== "toggle-link") {
        return;
    }

    event.preventDefault();

    isRegister = !isRegister;

    if (isRegister) {

        formTitle.textContent = "Register";
        nameField.classList.remove("hidden");
        document.getElementById("name").required = true;
        submitBtn.textContent = "Register";

        toggleText.innerHTML =
            'Already have an account? <a href="#" id="toggle-link">Login</a>';

    } else {

        formTitle.textContent = "Login";
        nameField.classList.add("hidden");
        document.getElementById("name").required = false;
        submitBtn.textContent = "Login";

        toggleText.innerHTML =
            'Don\'t have an account? <a href="#" id="toggle-link">Register</a>';
    }

    authForm.reset();
    message.textContent = "";
});


authForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    let endpoint;
    let requestData;

    if (isRegister) {

        endpoint = "/register";

        requestData = {
            name: name,
            email: email,
            password: password
        };

    } else {

        endpoint = "/login";

        requestData = {
            email: email,
            password: password
        };
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait...";
    message.textContent = "";

    try {

        const response = await fetch(API_URL + endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong");
        }

        if (isRegister) {

            message.textContent = "Registration successful! Please login.";
            message.style.color = "green";

            authForm.reset();

            isRegister = false;
            formTitle.textContent = "Login";
            nameField.classList.add("hidden");
            document.getElementById("name").required = false;
            submitBtn.textContent = "Login";

            toggleText.innerHTML =
                'Don\'t have an account? <a href="#" id="toggle-link">Register</a>';

        } else {

            sessionStorage.setItem("access_token", data.access_token);

            message.textContent = "Checking your profile...";
            message.style.color = "green";

            const profileResponse = await fetch(API_URL + "/profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${data.access_token}`
                }
            });

            const profileData = await profileResponse.json();

            if (!profileResponse.ok) {
                throw new Error(
                    profileData.detail || "Unable to check profile"
                );
            }

            if (profileData.profile_completed === true) {

                window.location.href = "dashboard.html";

            } else {

                window.location.href = "profile.html";
            }
        }

    } catch (error) {

        message.textContent = error.message;
        message.style.color = "red";

    } finally {

        submitBtn.disabled = false;
        submitBtn.textContent = isRegister ? "Register" : "Login";

    }

});
