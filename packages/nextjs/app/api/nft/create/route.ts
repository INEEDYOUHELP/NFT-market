import { NextResponse } from 'next/server';
import { nftService } from '../../../../../mysql/nftService';

export async function POST(request: Request) {
  try {
    const nftData = await request.json();
    
    // 详细的字段验证
    const missingFields = [];
    if (!nftData.token_id) missingFields.push('token_id');
    if (!nftData.name) missingFields.push('name');
    if (!nftData.uri) missingFields.push('uri');

    if (missingFields.length > 0) {
      console.error('Missing required fields:', { 
        missingFields,
        receivedData: nftData 
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          receivedData: nftData
        },
        { status: 400 }
      );
    }

    // 确保数值类型正确
    const processedData = {
      token_id: Number(nftData.token_id),
      name: String(nftData.name).trim(),
      description: String(nftData.description || '').trim(),
      uri: String(nftData.uri).trim(),
      price: Number(nftData.price || 0),
      royalty: Number(nftData.royalty || 0),
      creator: String(nftData.creator || '').trim(),
      owner: String(nftData.owner || '').trim(),
      rarity: String(nftData.rarity || 'Common').trim(),
    };

    // 验证处理后的数据
    if (isNaN(processedData.token_id)) {
      throw new Error('Invalid token_id: must be a number');
    }
    if (processedData.name.length === 0) {
      throw new Error('Name cannot be empty');
    }
    if (processedData.uri.length === 0) {
      throw new Error('URI cannot be empty');
    }

    console.log('Attempting to create NFT with processed data:', processedData);
    
    // 调用 nftService 创建 NFT 记录
    const result = await nftService.createNFT(processedData);
    console.log('NFT created successfully:', result);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    // 详细记录错误
    console.error('创建 NFT 记录失败. 完整错误:', error);
    if (error instanceof Error) {
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 