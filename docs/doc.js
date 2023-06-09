document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('pre code').forEach((el) => {
        const html = el.innerHTML
        const lines = html.split("\n")
        const minSpaces = lines.filter(line => line.trim() !== "").reduce((acc, line) => Math.min(line.search(/\S|$/), acc), Infinity)
        el.innerHTML = lines.map(line => line.substring(minSpaces)).join("\n").trim()
      });
});


function reactElementNameChange(event) {
  const componentName = event.target.closest(".component-name-edit")
  if(componentName == null){ return false }
  const newText = componentName.textContent
  document.body.querySelectorAll(".component-name-ref").forEach(ref => ref.textContent = newText)
  return true
}


document.body.addEventListener("input", (event) => {
  reactElementNameChange(event)
})
