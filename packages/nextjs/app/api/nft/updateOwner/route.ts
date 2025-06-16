import { NextResponse } from 'next/server';
import { nftService } from '../../../../../mysql/nftService';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.token_id || !data.new_owner) {
      return NextResponse.json(
        { success: false, error: 'token_id and new_owner are required' },
        { status: 400 }
      );
    }

    // 更新所有者
    const result = await nftService.updateOwner(
      data.token_id,
      data.new_owner
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('更新NFT所有者失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update owner',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 