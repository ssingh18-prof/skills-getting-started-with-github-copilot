document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeout;

  function showMessage(text, kind) {
    messageDiv.textContent = text;
    messageDiv.className = kind;
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.length = 1;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        activityCard.appendChild(participantsHeading);

        const participantList = document.createElement("ul");
        participantList.className = "participant-list";
        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.textContent = "No participants yet";
          participantList.appendChild(emptyMessage);
        }
        details.participants.forEach((email) => {
          const item = document.createElement("li");
          const label = document.createElement("span");
          label.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant";
          removeButton.textContent = "\u00d7";
          removeButton.title = `Unregister ${email}`;
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();
              if (!response.ok) throw new Error(result.detail || "Unable to unregister student");
              showMessage(result.message, "success");
              await fetchActivities();
            } catch (error) {
              showMessage(error.message, "error");
              removeButton.disabled = false;
            }
          });

          item.append(label, removeButton);
          participantList.appendChild(item);
        });
        activityCard.appendChild(participantList);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
