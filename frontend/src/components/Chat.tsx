import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  CircularProgress,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isUnanswered?: boolean;
}

interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Stack Overflow-style chatbot. Ask me a question or upload a document.',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    onDrop: (acceptedFiles) => {
      handleFileUpload(acceptedFiles);
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // API call to backend
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });
      
      const data = await response.json();
      
      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || "I'm not sure about that. I'll flag this for our team to look into.",
        isUser: false,
        timestamp: new Date(),
        isUnanswered: !data.answer
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Error handling
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error processing your request.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileUpload = async (files: File[]) => {
    // Create file upload entries
    const newUploads = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));
    
    setFileUploads(prev => [...prev, ...newUploads]);
    
    // Add file upload message
    const uploadMessage: Message = {
      id: Date.now().toString(),
      text: `Uploading ${files.length} file(s): ${files.map(f => f.name).join(', ')}`,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, uploadMessage]);
    
    // Process each file
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        // Update file status
        setFileUploads(prev => 
          prev.map(upload => 
            upload.file === file 
              ? { ...upload, progress: 100, status: 'complete' } 
              : upload
          )
        );
        
        // Add bot response about the file
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message || `I've processed ${file.name} and added its content to my knowledge base.`,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        // Update file status to error
        setFileUploads(prev => 
          prev.map(upload => 
            upload.file === file 
              ? { ...upload, status: 'error' } 
              : upload
          )
        );
        
        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Sorry, I encountered an error processing ${file.name}.`,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    }
    
    setShowUpload(false);
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 2, height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Technical Support Chatbot
        </Typography>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Messages Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, p: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem 
                key={message.id} 
                sx={{ 
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Paper 
                  elevation={1}
                  sx={{ 
                    p: 2, 
                    maxWidth: '80%',
                    backgroundColor: message.isUser ? '#e3f2fd' : '#f5f5f5',
                    borderRadius: '10px',
                  }}
                >
                  <Typography variant="body1">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </Typography>
                  
                  {message.isUnanswered && (
                    <Chip 
                      label="Unanswered" 
                      color="warning" 
                      size="small" 
                      sx={{ mt: 1 }} 
                    />
                  )}
                  
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
            
            {isLoading && (
              <ListItem sx={{ justifyContent: 'flex-start', mb: 1 }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2">Thinking...</Typography>
              </ListItem>
            )}
            
            <div ref={messagesEndRef} />
          </List>
        </Box>
        
        {/* File Upload Area */}
        {showUpload && (
          <Paper
            sx={{ 
              p: 2, 
              mb: 2, 
              backgroundColor: '#f9f9f9', 
              border: '2px dashed #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <UploadFileIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" align="center">
                Drag & drop PDF or DOCX files here, or click to select files
              </Typography>
            </Box>
          </Paper>
        )}
        
        {/* Input Area */}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => setShowUpload(!showUpload)} color="primary">
            <AttachFileIcon />
          </IconButton>
          
          <TextField
            fullWidth
            placeholder="Type your question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            variant="outlined"
            size="small"
            disabled={isLoading}
            sx={{ mr: 1 }}
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={isLoading || input.trim() === ''}
            endIcon={<SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;
