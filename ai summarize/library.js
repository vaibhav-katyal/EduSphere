document.addEventListener("DOMContentLoaded", () => {
    const libraryItems = document.getElementById("library-items");
    const searchInput = document.getElementById("search-input");
    const categoryList = document.getElementById("category-list");
    const uploadBtn = document.getElementById("upload-btn");
    const titleInput = document.getElementById("material-title");
    const typeSelect = document.getElementById("material-type");
    const fileInput = document.getElementById("material-file");
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");
    const closeSidebar = document.getElementById("close-sidebar");
    const summarizeBtn = document.getElementById("summarize-btn");
    const pdfFileInput = document.getElementById("pdf-file");
    const summaryResult = document.getElementById("summary-result");
    const closeSummaryBtn = document.getElementById("close-summary-btn");

    let materials = JSON.parse(localStorage.getItem("materials")) || [
        { id: 1, title: "Python Notes", type: "notes", file: "files/python_notes.pdf", preview: "files/python_notes.pdf" },
        { id: 2, title: "Top 50 C++ Problems", type: "pdf", file: "files/cpp_problems.pdf", preview: "files/cpp_problems.pdf" },
        { id: 3, title: "OOPS in C", type: "books", file: "files/oops_in_c.pdf", preview: "files/oops_in_c.pdf" },
        { id: 4, title: "Algebra Guide", type: "notes", file: "files/algebra_guide.pdf", preview: "files/algebra_guide.pdf" },
        { id: 5, title: "Data Structures", type: "books", file: "files/fibre_optics_ppt.pdf", preview: "files/fibre_optics_ppt.pdf" },
        { id: 6, title: "C++ One Shot By Shraddha Khapra", type: "videos", file: "", preview: "https://www.youtube.com/watch?v=8THKAHMMwY8" },
        { id: 7, title: "DSA playlist by Striver", type: "videos", file: "", preview: "https://youtu.be/37E9ckMDdTk?feature=shared" }
    ];

    function displayMaterials(category = "all", filteredMaterials = null) {
        libraryItems.innerHTML = "";
        let itemsToDisplay = filteredMaterials || materials;

        itemsToDisplay.forEach(item => {
            if (category === "all" || item.type === category) {
                const div = document.createElement("div");
                div.classList.add("library-item");

                let downloadButton = item.file
                    ? `<button onclick="downloadMaterial('${item.file}')">Download</button>`
                    : "";

                div.innerHTML = `
                    <h3>${item.title}</h3>
                    <button onclick="previewMaterial('${item.preview}')">Preview</button>
                    ${downloadButton}
                `;

                libraryItems.appendChild(div);
            }
        });
    }

    function previewMaterial(previewLink) {
        if (previewLink.includes("youtube.com") || previewLink.includes("youtu.be")) {
            window.open(previewLink, "_blank");
        } else if (previewLink.endsWith(".pdf")) {
            const previewContainer = document.createElement('div');
            previewContainer.id = 'preview-container';
            previewContainer.style.position = 'fixed';
            previewContainer.style.top = '0';
            previewContainer.style.left = '0';
            previewContainer.style.width = '100%';
            previewContainer.style.height = '100%';
            previewContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
            previewContainer.style.zIndex = '1000';

            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '10px';
            closeButton.style.right = '10px';
            closeButton.style.fontSize = '20px';
            closeButton.style.color = 'white';
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = closePreview;

            const iframe = document.createElement('iframe');
            iframe.src = previewLink;
            iframe.style.width = '90%';
            iframe.style.height = '90%';
            iframe.style.position = 'absolute';
            iframe.style.top = '5%';
            iframe.style.left = '5%';
            iframe.style.border = 'none';

            previewContainer.appendChild(closeButton);
            previewContainer.appendChild(iframe);
            document.body.appendChild(previewContainer);
        } else {
            alert("Preview not available for this file type.");
        }
    }

    function closePreview() {
        const previewContainer = document.getElementById('preview-container');
        if (previewContainer) {
            document.body.removeChild(previewContainer);
        }
    }

    function downloadMaterial(file) {
        if (!file) {
            alert("Download not available for this file.");
            return;
        }
        const link = document.createElement('a');
        link.href = file;
        link.download = file.split('/').pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    searchInput.addEventListener("input", () => {
        let searchText = searchInput.value.toLowerCase();
        let filteredMaterials = materials.filter(item => item.title.toLowerCase().includes(searchText));
        displayMaterials("all", filteredMaterials);
    });

    categoryList.addEventListener("click", (e) => {
        if (e.target.tagName === "LI") {
            document.querySelectorAll("#category-list li").forEach(li => li.classList.remove("active"));
            e.target.classList.add("active");
            displayMaterials(e.target.getAttribute("data-category"));
        }
    });

    uploadBtn.addEventListener("click", () => {
        const title = titleInput.value.trim();
        const type = typeSelect.value;
        const file = fileInput.files[0];

        if (!title || !type || !file) {
            alert("Please fill all fields.");
            return;
        }

        const fileURL = URL.createObjectURL(file);

        const newMaterial = {
            id: materials.length + 1,
            title: title,
            type: type,
            file: fileURL,
            preview: fileURL
        };

        materials.push(newMaterial);
        localStorage.setItem("materials", JSON.stringify(materials));
        displayMaterials();

        titleInput.value = "";
        typeSelect.value = "";
        fileInput.value = "";
    });

    hamburger.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        hamburger.style.display = 'none';
        closeSidebar.style.display = 'block';
    });

    closeSidebar.addEventListener("click", () => {
        sidebar.classList.remove("active");
        closeSidebar.style.display = 'none';
        hamburger.style.display = 'block';
    });

    summarizeBtn.addEventListener("click", async () => {
        const file = pdfFileInput.files[0];

        if (!file) {
            alert("Please select a PDF file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://127.0.0.1:5001/summarize", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.summary) {
                let formattedSummary = formatSummary(data.summary);
                summaryResult.innerHTML = `<div class="summary-box">${formattedSummary}</div>`;
            } else {
                summaryResult.innerHTML = `<p style="color:red;">Error summarizing the file!</p>`;
            }
        } catch (error) {
            summaryResult.innerHTML = `<p style="color:red;">Server error: ${error.message}</p>`;
        }
    });

    function formatSummary(summary) {
        return summary
            .replace(/\. /g, ".<br><br>") // Add line breaks after each sentence
            .replace(/\b(Advantages|Benefits|Key Points|Conclusion|Summary)\b/g, "<strong>$1</strong>") // Bold common key terms
            .replace(/\b(Laser|AI|Machine Learning|Neural Networks|Quantum|Blockchain|Data Science|Cybersecurity)\b/g, "<strong>$1</strong>"); // Bold tech-related words
    }

    displayMaterials();

    window.previewMaterial = previewMaterial;
    window.downloadMaterial = downloadMaterial;
    window.closePreview = closePreview;
});

document.getElementById("toggle-upload-btn").addEventListener("click", () => {
    const uploadSection = document.getElementById("upload-section");
    uploadSection.style.display = uploadSection.style.display === "none" ? "block" : "none";
});
document.getElementById("pdf-file").addEventListener("change", function() {
    const fileName = this.files.length > 0 ? this.files[0].name : "No file chosen";
    document.getElementById("file-name").textContent = fileName;
});
