const JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0YzlmYWMxMy1jNWNkLTRjZmItODQ2Zi1lMzJjNTU2Mjk0MDMiLCJlbWFpbCI6IjEzMjM1Mzg2ODBAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjgxMzI5MDhjN2E5YjAxYjcxM2ViIiwic2NvcGVkS2V5U2VjcmV0IjoiYTU0ZmVhMWIxNjdhMTg5YTVjOTM1Y2I0ZWViMTEyZjM5OTNiYmM1YjdmZDZkOTkwNTZmYmU1YTc5MGQ0N2E1MSIsImV4cCI6MTc2NDA1MDg3N30.ilO_4MppVtfntTzuUdzk1zbULwzI0rhY5GfJYUT1sWk`;

// IPFS 网关配置
const IPFS_GATEWAYS = {
  PINATA: 'https://gateway.pinata.cloud/ipfs/',
  PUBLIC: 'https://ipfs.io/ipfs/'
};

/**
 * 将IPFS链接转换为可访问的HTTP链接
 * @param ipfsUrl IPFS格式的URL (ipfs://...)
 * @returns 可访问的HTTP URL
 */
export const getAccessibleUrl = (ipfsUrl: string): string => {
  if (!ipfsUrl) return '';
  
  // 如果已经是http(s)链接，直接返回
  if (ipfsUrl.startsWith('http')) {
    return ipfsUrl;
  }

  // 处理ipfs://格式的链接
  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    return `${IPFS_GATEWAYS.PUBLIC}${hash}`;
  }

  // 如果只是hash值，直接添加网关前缀
  if (ipfsUrl.match(/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/)) {
    return `${IPFS_GATEWAYS.PUBLIC}${ipfsUrl}`;
  }

  return ipfsUrl;
};

const fetchFromApi = async ({ path, method, body }: { path: string; method: string; body?: object }) => {
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(body ? { "Authorization": `Bearer ${JWT}` } : {}),
    };

    const response = await fetch(path, {
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const addToIPFS = async (yourJSON: object) => {
  try {
    // 确保 image 字段使用可访问的 URL 格式
    const jsonData = {
      ...yourJSON,
      image: yourJSON.image, // 这里的 image 应该已经是可访问的 URL
    };

    const data = await fetchFromApi({
      path: `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
      method: "POST",
      body: {
        pinataMetadata: { name: "nftsMetadata.json" },
        pinataContent: jsonData,
      },
    });

    if (!data || !data.IpfsHash) {
      throw new Error('Failed to get IPFS hash from Pinata');
    }

    const CID = data.IpfsHash;
    const metadataUrl = `${IPFS_GATEWAYS.PUBLIC}${CID}`;
    
    console.log('IPFS Upload Success:', { 
      CID, 
      metadataUrl,
      imageUrl: jsonData.image 
    });
    
    return { 
      CID,
      path: metadataUrl,
      imageUrl: jsonData.image, // 返回图片 URL
      ...data 
    };
  } catch (error) {
    console.error('IPFS Upload Error:', error);
    throw error;
  }
};

export const getMetadataFromIPFS = async (CID: string) => {
  try {
    // 如果输入的是完整的URL，提取CID
    if (CID.includes('/ipfs/')) {
      CID = CID.split('/ipfs/')[1];
    } else if (CID.startsWith('ipfs://')) {
      CID = CID.replace('ipfs://', '');
    }

    // 首先尝试使用公共网关
    const url = `${IPFS_GATEWAYS.PUBLIC}${CID}`;
    const response = await fetch(url);
    if (!response.ok) {
      // 如果公共网关失败，尝试使用 Pinata 网关
      const pinataUrl = `${IPFS_GATEWAYS.PINATA}${CID}`;
      const pinataResponse = await fetch(pinataUrl);
      if (!pinataResponse.ok) {
        throw new Error(`HTTP error! status: ${pinataResponse.status}`);
      }
      return await pinataResponse.json();
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data from IPFS:", error);
    throw error;
  }
};

