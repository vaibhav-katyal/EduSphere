from flask import Flask, request, jsonify, render_template
import fitz  # PyMuPDF
from transformers import pipeline
from flask_cors import CORS
import os

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)  # Enable CORS for all routes

# Load the summarization pipeline
summarizer = pipeline("summarization", framework="pt")  # Ensure PyTorch is used

def split_text(text, max_words=500):
    """Splits text into chunks of max_words words each."""
    words = text.split()
    return [" ".join(words[i:i + max_words]) for i in range(0, len(words), max_words)]

@app.route('/')
def index():
    return render_template('library.html')

@app.route('/summarize', methods=['POST'])
def summarize_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Extract text from PDF
        pdf_document = fitz.open(stream=file.read(), filetype="pdf")
        text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text += page.get_text()

        # Split text into smaller chunks
        text_chunks = split_text(text, max_words=500)

        # Summarize each chunk and combine results
        summaries = [summarizer(chunk, max_length=150, min_length=30, do_sample=False)[0]['summary_text'] for chunk in text_chunks]

        # Join all summarized parts
        final_summary = " ".join(summaries)

        return jsonify({"summary": final_summary}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Specify a different port