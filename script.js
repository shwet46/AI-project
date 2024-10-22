document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

async function sendMessage() {
  const userInput = document.getElementById('user-input').value.trim();

  if (!userInput) return;

  appendMessage('user', userInput);
  document.getElementById('user-input').value = '';

  try {
    const botResponse = await getChatbotResponse(userInput);
    if (botResponse) {
      appendMessage('bot', botResponse);
    } else {
      appendMessage('bot', 'Sorry, I could not generate a response.');
    }
  } catch (error) {
    console.error("Error:", error);
    appendMessage('bot', `Error: ${error.message}`);
  }
}

function appendMessage(sender, message) {
  const chatBox = document.getElementById('chat-box');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  messageElement.innerHTML = `<p>${message}</p>`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function getChatbotResponse(userMessage, retries = 3) {
  const API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1';
  const API_TOKEN = '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';

  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    inputs: `<s>[INST] ${userMessage} [/INST]`,
    parameters: {
      max_new_tokens: 150,
      temperature: 0.7,
      top_p: 0.95,
      do_sample: true,
    },
  });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (response.status === 503 && retries > 0) {
      const data = await response.json();
      const waitTime = data.estimated_time || 20;
      console.log(`Model is loading. Retrying in ${waitTime} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      return getChatbotResponse(userMessage, retries - 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (data && Array.isArray(data) && data[0] && data[0].generated_text) {
      return data[0].generated_text.trim().replace(/^<s>\[INST\].*?\[\/INST\]\s*/s, '');
    } else {
      console.error('Unexpected API response structure:', data);
      return 'Sorry, I could not generate a response.';
    }
  } catch (error) {
    console.error('Error fetching chatbot response:', error);
    throw error;
  }
}

async function checkApiAccess() {
  try {
    const response = await getChatbotResponse('Hello, how are you?');
    console.log('API access test response:', response);
    alert('API access test successful!');
  } catch (error) {
    console.error('API access test failed:', error);
    alert('API access test failed. Check the console for details.');
  }
}

window.addEventListener('load', checkApiAccess);