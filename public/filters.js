function applyFilters() {
  const calorieValues = document
    .getElementById("calories-slider")
    .noUiSlider.get();

  const filters = {
    bulk_cut: document.querySelector("#flexSwitchCheckDefault").checked,
    calories_min: Number(calorieValues[0]),
    calories_max: Number(calorieValues[1]),
  };

  fetch("/recipes/filter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      updateRecipeList(data);
    })
    .catch((err) => console.error("❌ Błąd AJAX:", err));
}

function updateRecipeList(recipes) {
  const container = document.getElementById("recipes-container");
  container.innerHTML = "";

  if (!recipes || recipes.length === 0) {
    container.innerHTML = "<p>Brak przepisów spełniających kryteria.</p>";
    return;
  }

  recipes.forEach((recipe) => {
    container.innerHTML += `
      <div class="card my-2">
        <div class="card-body">
          <h5 class="card-title">${recipe.description}</h5>
          <p class="card-text">${recipe.instruction}</p>
        </div>
      </div>
    `;
  });
}
