import os
import logging
from typing import List, Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CyService:
    # ... (init methods)

    def __init__(self):
        if getattr(self, "initialized", False):
            return
            
        self.persist_directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "cy_vector_db")
        self.embedding_function = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        
        # Initialize ChromaDB
        self.vector_store = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embedding_function,
            collection_name="codelife_knowledge_base"
        )
        
        # Initialize Gemini LLM
        # Expects GOOGLE_API_KEY in environment variables
        try:
            if os.getenv("GOOGLE_API_KEY"):
                self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.3)
                logger.info("Gemini LLM initialized successfully.")
            else:
                self.llm = None
                logger.warning("GOOGLE_API_KEY not found. Gemini LLM not initialized.")
        except Exception as e:
            self.llm = None
            logger.warning(f"Failed to initialize Gemini LLM: {str(e)}")
        
        self.initialized = True
        logger.info(f"CyService initialized with Vector DB at {self.persist_directory}")

    def add_document(self, content: str, metadata: Dict[str, Any]):
        """
        Add a document to the knowledge base.
        """
        try:
            doc = Document(page_content=content, metadata=metadata)
            self.vector_store.add_documents([doc])
            logger.info(f"Added document: {metadata.get('title', 'Untitled')}")
        except Exception as e:
            logger.error(f"Error adding document: {str(e)}")
            raise

    def search_context(self, query: str, k: int = 3) -> List[Document]:
        """
        Retrieve relevant context for a query.
        """
        try:
            return self.vector_store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"Error searching context: {str(e)}")
            return []

    async def generate_response(self, query: str, context_docs: List[Document], user_context: Dict[str, Any]) -> str:
        """
        Generate a response using Gemini 1.5 Flash.
        Enforces 'Tutor Policy': Guide, don't solve.
        """
        context_text = "\n\n".join([d.page_content for d in context_docs])
        
        system_prompt = """You are Cy, an expert AI Cybersecurity Tutor for the CodeLife platform. 
Your goal is to help students learn by guiding them, NOT by giving direct answers or flags.

Context Guidelines:
- Use the provided 'Course Material' to answer questions accurately.
- If the user asks for a specific flag or solution (e.g., "What is the answer to Lab 3?"), refuse politely and provide a conceptual hint instead.
- Be encouraging, concise, and professional.
- If the context doesn't contain the answer, say "I don't have that information right now" but try to help with general security knowledge.

Current User Context:
"""
        if user_context:
            path = user_context.get('path', 'Unknown')
            system_prompt += f"\n- Current Path: {path}"
            if "pqc-lab" in path:
                system_prompt += "\n- Context Note: The user is currently in the Post-Quantum Cryptography Lab. Your explanations should cover Shor's Algorithm, NIST standards (like CRYSTALS-Kyber/Dilithium), lattice-based concepts, and key size tradeoffs."
        
        user_message = f"""Course Material:
{context_text}

Student Question: 
{query}
"""
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message)
            ]
            response = await self.llm.ainvoke(messages)
            return response.content
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I'm having trouble connecting to my brain (LLM) right now. Please check your API key or internet connection."

# Global instance
cy_service = CyService()
