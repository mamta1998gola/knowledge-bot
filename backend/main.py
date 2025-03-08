# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import uuid
from datetime import datetime
import os
import shutil
import tempfile
from io import BytesIO

# Document processing
import PyPDF2
import docx

# Vector database 
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

# Confluence API
from atlassian import Confluence

# API models
class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: Optional[str] = None
    source: Optional[str] = None
    is_unanswered: bool = False

class UnansweredQuestion(BaseModel):
    id: str
    text: str
    timestamp: datetime
    answered: bool = False

class AnswerRequest(BaseModel):
    questionId: str
    answer: str

class UnansweredQuestionsResponse(BaseModel):
    questions: List[UnansweredQuestion]

class FileUploadResponse(BaseModel):
    filename: str
    content_type: str
    size: int
    message: str
    success: bool

# Create FastAPI app
app = FastAPI(title="Stack Overflow-style Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vector store implementation
class VectorStore:
    def __init__(self):
        # Initialize sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.documents = []
        self.document_embeddings = None
        self.index = None
        self.unanswered_questions = []
        self.manual_answers = {}
    
    def add_document(self, text, source):
        # Add document to collection
        doc_id = str(uuid.uuid4())
        self.documents.append({
            "id": doc_id,
            "text": text,
            "source": source,
            "timestamp": datetime.now()
        })
        
        # Regenerate index
        self._update_index()
    
    def _update_index(self):
        # Create embeddings for all documents
        if not self.documents:
            return
            
        texts = [doc["text"] for doc in self.documents]
        embeddings = self.model.encode(texts)
        
        # Store embeddings
        self.document_embeddings = embeddings
        
        # Create FAISS index (use L2 distance)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype('float32'))
    
    def search(self, query, top_k=5):
        # Generate embedding for query
        query_embedding = self.model.encode([query])
        
        # Search index
        if self.index is None:
            return []
            
        distances, indices = self.index.search(np.array(query_embedding).astype('float32'), k=top_k)
        
        # Return results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.documents) and distances[0][i] < 30:  # Distance threshold
                results.append({
                    "document": self.documents[idx],
                    "score": float(distances[0][i])
                })
        
        return results
    
    def add_unanswered_question(self, text):
        question_id = str(uuid.uuid4())
        question = {
            "id": question_id,
            "text": text,
            "timestamp": datetime.now(),
            "answered": False
        }
        self.unanswered_questions.append(question)
        return question_id
    
    def add_manual_answer(self, question_id, answer):
        # Find the question
        for question in self.unanswered_questions:
            if question["id"] == question_id:
                question["answered"] = True
                self.manual_answers[question_id] = {
                    "text": answer,
                    "timestamp": datetime.now()
                }
                
                # Also add to documents for vector search
                self.add_document(
                    f"Q: {question['text']}\nA: {answer}",
                    f"Manual answer for question {question_id}"
                )
                return True
        return False
    
    def get_manual_answer(self, question_id):
        return self.manual_answers.get(question_id)
    
    def get_unanswered_questions(self):
        return self.unanswered_questions

# File processing utilities
class FileProcessor:
    @staticmethod
    def extract_text_from_pdf(file_content):
        pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
        text = ""
        for page_num in range(len(pdf_reader.pages)):
            text += pdf_reader.pages[page_num].extract_text()
        return text

    @staticmethod
    def extract_text_from_docx(file_content):
        doc = docx.Document(BytesIO(file_content))
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return '\n'.join(text)

# Confluence integration
class ConfluenceService:
    def __init__(self, url, username, api_token):
        self.confluence = Confluence(
            url=url,
            username=username,
            password=api_token,
            cloud=True  # Set to False for server instances
        )
    
    def get_page_content(self, page_id):
        page = self.confluence.get_page_by_id(page_id)
        if not page:
            return None
        
        # Get page content
        content = self.confluence.get_page_by_id(page_id, expand='body.storage')
        body = content.get('body', {}).get('storage', {}).get('value', '')
        
        # Convert HTML to plain text (simplified)
        # In a real implementation, use a proper HTML to text converter
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(body, 'html.parser')
        text = soup.get_text()
        
        return {
            'id': page_id,
            'title': page.get('title', ''),
            'text': text,
            'url': page.get('_links', {}).get('base', '') + page.get('_links', {}).get('webui', '')
        }
    
    def search_content(self, query, limit=10):
        results = self.confluence.cql(f'text ~ "{query}"', limit=limit)
        pages = []
        
        for result in results.get('results', []):
            page_id = result.get('content', {}).get('id')
            if page_id:
                page_content = self.get_page_content(page_id)
                if page_content:
                    pages.append(page_content)
        
        return pages

# Initialize services
vector_store = VectorStore()

# Add some sample data
vector_store.add_document(
    "To connect to Confluence, you need to use the Confluence API with an authentication token.", 
    "Knowledge Base - Confluence Integration"
)

vector_store.add_document(
    "Our chatbot uses a vector database to store document embeddings for semantic search.",
    "Knowledge Base - Vector Databases"
)

vector_store.add_document(
    "When uploading PDF files to the chatbot, make sure they are text-based and not scanned images.",
    "Knowledge Base - File Uploads"
)

# Confluence service initialization (with environment variables in a real app)
# confluence_service = ConfluenceService(
#     url=os.environ.get("CONFLUENCE_URL", ""),
#     username=os.environ.get("CONFLUENCE_USERNAME", ""),
#     api_token=os.environ.get("CONFLUENCE_API_TOKEN", "")
# )

# API endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to the Stack Overflow-style Chatbot API"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    query = request.query
    
    # Search for relevant documents
    search_results = vector_store.search(query)
    
    if search_results:
        # Get the most relevant document
        top_result = search_results[0]["document"]
        
        return ChatResponse(
            answer=top_result["text"],
            source=top_result["source"],
            is_unanswered=False
        )
    else:
        # No relevant document found, mark as unanswered
        question_id = vector_store.add_unanswered_question(query)
        
        return ChatResponse(
            answer=None,
            source=None,
            is_unanswered=True
        )

@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file type
    if file.content_type not in [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]:
        raise HTTPException(
            status_code=400, 
            detail="Only PDF and DOCX files are supported"
        )
    
    try:
        # Read file content
        content = await file.read()
        
        # Process based on file type
        if file.content_type == "application/pdf":
            text = FileProcessor.extract_text_from_pdf(content)
        else:  # DOCX
            text = FileProcessor.extract_text_from_docx(content)
        
        # Add to vector store
        vector_store.add_document(
            text=text,
            source=f"Uploaded file: {file.filename}"
        )
        
        return FileUploadResponse(
            filename=file.filename,
            content_type=file.content_type,
            size=len(content),
            message=f"Successfully processed {file.filename} and added to knowledge base",
            success=True
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )
    finally:
        await file.close()

@app.get("/api/admin/unanswered", response_model=UnansweredQuestionsResponse)
async def get_unanswered_questions():
    # Convert to Pydantic model format
    questions = [
        UnansweredQuestion(
            id=q["id"],
            text=q["text"],
            timestamp=q["timestamp"],
            answered=q.get("answered", False)
        )
        for q in vector_store.get_unanswered_questions()
    ]
    
    return UnansweredQuestionsResponse(questions=questions)

@app.post("/api/admin/answer", status_code=200)
async def answer_question(request: AnswerRequest):
    success = vector_store.add_manual_answer(
        question_id=request.questionId,
        answer=request.answer
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Question with ID {request.questionId} not found"
        )
    
    return {"message": "Answer added successfully"}

@app.post("/api/confluence/connect")
async def connect_confluence(
    url: str = Form(...),
    username: str = Form(...),
    api_token: str = Form(...)
):
    try:
        # Initialize Confluence service
        confluence_service = ConfluenceService(
            url=url,
            username=username,
            api_token=api_token
        )
        
        # Test connection
        spaces = confluence_service.confluence.get_all_spaces(limit=1)
        
        return {"message": "Successfully connected to Confluence", "success": True}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Confluence: {str(e)}"
        )

@app.get("/api/confluence/search")
async def search_confluence(
    query: str,
    limit: int = 10
):
    # This would use the actual confluence_service in a real app
    # For demo purposes, we'll return a mock response
    return {
        "results": [
            {
                "id": "12345",
                "title": "Sample Confluence Page",
                "excerpt": f"This is a sample page that matches your query: {query}",
                "url": "https://confluence.example.com/pages/12345"
            }
        ]
    }

@app.post("/api/confluence/import")
async def import_from_confluence(
    page_id: str = Form(...)
):
    # This would use the actual confluence_service in a real app
    # For demo purposes, we'll add a mock document to the vector store
    
    vector_store.add_document(
        text=f"This is imported content from Confluence page {page_id}. It contains technical documentation about our systems.",
        source=f"Confluence page: {page_id}"
    )
    
    return {"message": f"Successfully imported content from Confluence page {page_id}", "success": True}

# Run the application
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)