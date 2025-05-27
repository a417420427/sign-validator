import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';


interface FormState {
  appId: string;
  timestamp: string;
  nonceStr: string;
  secret: string;
  sign: string;
  signMode: 'simple' | 'strict';
  body: string;
}

const defaultFormState: FormState = {
  appId: '',
  timestamp: String(Date.now()),
  nonceStr: Math.random().toString(36).substring(2, 10),
  secret: '',
  sign: '',
  signMode: 'simple',
  body: `{
  "name": "chatgpt",
  "role": "assistant"
}`,
};

const SignForm: React.FC = () => {
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 简单工具函数：将对象变成 query 字符串（name=xxx&role=yyy）
  const mapToQueryParams = (obj: any): string => {
    return Object.keys(obj)
      .sort()
      .map((key) => `${key}=${encodeURIComponent(obj[key])}`)
      .join('&');
  };

  // 每次内容变动自动计算签名
 useEffect(() => {
  try {
    const bodyJson = JSON.parse(formData.body);
    let signBaseString = '';
    if(formData.signMode === 'simple') {
      signBaseString = '';
    } else if (Array.isArray(bodyJson)) {
      signBaseString = mapToQueryParams({ __ARRAY_0__: bodyJson });
    } else if (typeof bodyJson === 'object') {
      signBaseString = mapToQueryParams(bodyJson);
    } else {
      signBaseString = formData.body;
    }


    const raw = signBaseString + formData.timestamp + formData.nonceStr + formData.secret;
    const md5 = CryptoJS.MD5(raw).toString();

    setFormData((prev) => ({ ...prev, sign: md5 }));
  } catch {
    setFormData((prev) => ({ ...prev, sign: '' }));
  }
}, [formData.body, formData.timestamp, formData.nonceStr, formData.secret, formData.signMode]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVerify = async () => {
    try {
      const headers = {
        'x-open-appId': formData.appId,
        'x-open-timestamp': formData.timestamp,
        'x-open-nonceStr': formData.nonceStr,
        'x-open-sign': formData.sign,
        'x-open-sign-mode': formData.signMode,
      };

      const bodyData = JSON.parse(formData.body);
      const response = await axios.post('http://localhost:3001/api/verify', bodyData, { headers });

      setResult({ type: 'success', text: `✅ ${response.data.message}` });
    } catch (err: any) {
      setResult({ type: 'error', text: `❌ ${err.response?.data?.error || '验证失败'}` });
    }
  };

  return (
    <div className="container">
      <h2>OpenAPI 签名验证工具（自动签名）</h2>

      {['appId', 'timestamp', 'nonceStr', 'secret'].map((field) => (
        <div className="input-group" key={field}>
          <input
            placeholder={field}
            name={field}
            value={(formData as any)[field]}
            onChange={handleChange}
          />
        </div>
      ))}

      <div className="input-group">
        <select name="signMode" value={formData.signMode} onChange={handleChange}>
          <option value="simple">simple</option>
          <option value="strict">strict</option>
        </select>
      </div>

      <div className="input-group">
        <textarea
          name="body"
          rows={6}
          value={formData.body}
          onChange={handleChange}
          placeholder="请求体 JSON"
        />
      </div>

      <div className="input-group">
        <input
          name="sign"
          value={formData.sign}
          readOnly
          placeholder="生成的签名"
        />
      </div>

      <div className="input-group">
        <button onClick={handleVerify}>发送验证请求</button>
      </div>

      {result && (
        <div className={`result ${result.type}`}>
          {result.text}
        </div>
      )}
    </div>
  );
};

export default SignForm;
