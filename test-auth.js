const http = require('http');

const data = JSON.stringify({
  fullName: "Test User",
  email: "test.auth." + Date.now() + "@example.com",
  password: "securePassword123",
  role: "USER"
});

const options = {
  hostname: 'localhost',
  port: 8081,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  res.on('end', () => {
    console.log(`BODY: ${responseBody}`);
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('Registration successful. Verifying login...');
      const responseData = JSON.parse(responseBody);
      const email = JSON.parse(data).email;
      verifyLogin(email, "securePassword123");
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();

function verifyLogin(email, password) {
  const loginData = JSON.stringify({ email, password });
  const loginOptions = {
    hostname: 'localhost',
    port: 8081,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    let responseBody = '';
    console.log(`LOGIN STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    res.on('end', () => {
      console.log(`LOGIN BODY: ${responseBody}`);
    });
  });

  loginReq.on('error', (e) => {
    console.error(`problem with login request: ${e.message}`);
  });

  loginReq.write(loginData);
  loginReq.end();
}
