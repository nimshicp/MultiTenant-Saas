import fitz


async def extract_text_from_pdf(file):

    pdf_bytes = await file.read()

    pdf_document = fitz.open(
        stream=pdf_bytes,
        filetype="pdf"
    )

    extracted_text = ""

    for page in pdf_document:

        extracted_text += page.get_text()

    pdf_document.close()

    return extracted_text