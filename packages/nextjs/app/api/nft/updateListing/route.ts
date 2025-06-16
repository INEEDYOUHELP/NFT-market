import { NextResponse } from 'next/server';
import { nftService } from '../../../../../mysql/nftService';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.token_id) {
      return NextResponse.json(
        { success: false, error: 'token_id is required' },
        { status: 400 }
      );
    }

    // 更新上架状态
    const result = await nftService.updateListingStatus(
      data.token_id,
      data.is_listed,
      data.price ? Number(data.price) : undefined
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('更新NFT上架状态失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update listing status',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 