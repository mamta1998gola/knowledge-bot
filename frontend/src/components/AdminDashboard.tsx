import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  TextField,
  Button,
  Divider,
  Chip,
  Tab,
  Tabs
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface UnansweredQuestion {
  id: string;
  text: string;
  timestamp: Date;
  answered?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const [unansweredQuestions, setUnansweredQuestions] = useState<UnansweredQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<UnansweredQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Fetch unanswered questions from API
    fetchUnansweredQuestions();
  }, []);

  const fetchUnansweredQuestions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/unanswered');
      const data = await response.json();
      
      setUnansweredQuestions(data.questions.map((q: any) => ({
        ...q,
        timestamp: new Date(q.timestamp)
      })));
    } catch (error) {
      console.error('Error fetching unanswered questions:', error);
    }
  };

  const handleSelectQuestion = (question: UnansweredQuestion) => {
    setSelectedQuestion(question);
    setAnswer('');
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !answer.trim()) return;

    try {
      await fetch('http://localhost:8000/api/admin/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          answer: answer
        }),
      });

      // Update local state
      setUnansweredQuestions(prev => 
        prev.map(q => 
          q.id === selectedQuestion.id ? { ...q, answered: true } : q
        )
      );
      setSelectedQuestion(null);
      setAnswer('');
      
      // Refresh the questions list
      fetchUnansweredQuestions();
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3 }}>
        Admin Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Unanswered Questions" />
          <Tab label="Knowledge Base" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Questions List */}
          <Paper elevation={3} sx={{ p: 2, flex: 1, height: '70vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Unanswered Questions ({unansweredQuestions.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {unansweredQuestions.length > 0 ? (
                unansweredQuestions.map((question) => (
                  <ListItem
                    key={question.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      backgroundColor: selectedQuestion?.id === question.id ? '#e3f2fd' : '#f5f5f5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                      },
                    }}
                    onClick={() => handleSelectQuestion(question)}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body1">{question.text}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {question.timestamp.toLocaleString()}
                        </Typography>
                        {question.answered ? (
                          <Chip label="Answered" color="success" size="small" />
                        ) : (
                          <Chip label="Pending" color="warning" size="small" />
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
                  No unanswered questions at the moment.
                </Typography>
              )}
            </List>
          </Paper>
          
          {/* Answer Form */}
          <Paper elevation={3} sx={{ p: 2, flex: 1, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {selectedQuestion ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Answer Question
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
                  <Typography variant="body1">{selectedQuestion.text}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Asked on {selectedQuestion.timestamp.toLocaleString()}
                  </Typography>
                </Paper>
                
                <Box sx={{ flexGrow: 1 }}>
                  <TextField
                    label="Your Answer"
                    multiline
                    rows={10}
                    fullWidth
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    variant="outlined"
                    placeholder="Write your answer here... Markdown is supported."
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Preview:
                  </Typography>
                  <Paper elevation={1} sx={{ p: 2, mb: 2, minHeight: '100px', backgroundColor: '#f9f9f9' }}>
                    {answer ? (
                      <ReactMarkdown>{answer}</ReactMarkdown>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Preview will appear here...
                      </Typography>
                    )}
                  </Paper>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setSelectedQuestion(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmitAnswer}
                    disabled={!answer.trim()}
                  >
                    Submit Answer
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Select a question from the list to answer.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6">Knowledge Base Management</Typography>
        <Typography variant="body1">
          This section will allow you to manage Confluence integration, 
          uploaded documents, and manually added knowledge.
        </Typography>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6">Analytics Dashboard</Typography>
        <Typography variant="body1">
          This section will display usage statistics, popular questions,
          and performance metrics.
        </Typography>
      </TabPanel>
    </Container>
  );
};

export default AdminDashboard;
