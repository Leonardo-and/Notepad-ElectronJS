const { ipcRenderer } = require("electron");

const textarea = document.querySelector("textarea"),
  title = document.querySelector("title"),
  lines = document.querySelector(".lines-counter");

window.addEventListener("DOMContentLoaded", () => {
  countLines();
  ipcRenderer.on("set-file", (event, file) => {
    if (!file.saved) {
      title.innerHTML = `${file.name} (not saved) | Notepad`;
    } else {
      title.innerHTML = `${file.name} | Notepad`;
    }
    textarea.value = file.content;
    countLines();
  });

  textarea.addEventListener("keyup", () => {
    ipcRenderer.send("update-content", textarea.value);
  });
});

textarea.addEventListener("input", () => {
  countLines();
  const line = document.querySelectorAll(".line");
  const singleLine = document.querySelector(".line");
  lines.style.height = line.length * singleLine.clientHeight + 50 + "px";
  textarea.style.height = lines.style.height;
});

// Contador de linhas
function countLines() {
  const linesCount = textarea.value.split("\n");
  lines.innerHTML = "";

  for (let i = 0; i < linesCount.length; i++) {
    const lineNumber = i + 1;
    const lineDiv = document.createElement("div");
    lineDiv.textContent = `${lineNumber}`;
    lineDiv.classList.add("line");
    lines.appendChild(lineDiv);
  }

  lines.style.height = textarea.scrollHeight + "px";
}

// Espaçamento com o Tab
textarea.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const spaces = "  ";
    textarea.value =
      textarea.value.substring(0, start) +
      spaces +
      textarea.value.substring(end);

    textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
  }
});
