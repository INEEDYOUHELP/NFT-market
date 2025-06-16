import mysql from 'mysql2/promise';
import { dbConfig } from './config';

// 创建连接池
const pool = mysql.createPool(dbConfig);

// NFT 类型定义
interface NFT {
  id: number;
  token_id: number;
  name: string;
  description: string;
  uri: string;
  price: number;
  royalty: number;
  creator: string;
  owner: string;
  rarity: string;
  is_listed: boolean;
  created_at: Date;
  updated_at: Date;
}

// NFT 服务类
export class NFTService {
  // 创建 NFT 记录
  async createNFT(nftData: {
    token_id: number;
    name: string;
    description: string;
    uri: string;
    price: number;
    royalty: number;
    creator: string;
    owner: string;
    rarity: string;
  }) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `INSERT INTO nfts (
          token_id, name, description, uri, price, royalty, 
          creator, owner, rarity, is_listed, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false, NOW())`,
        [
          nftData.token_id,
          nftData.name,
          nftData.description,
          nftData.uri,
          nftData.price,
          nftData.royalty,
          nftData.creator,
          nftData.owner,
          nftData.rarity,
        ]
      );
      connection.release();
      return result;
    } catch (error) {
      console.error('创建 NFT 记录失败:', error);
      throw error;
    }
  }

  // 更新 NFT 上架状态
  async updateListingStatus(tokenId: number, isListed: boolean, price?: number) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        'UPDATE nfts SET is_listed = ?, price = ? WHERE token_id = ?',
        [isListed, price || null, tokenId]
      );
      connection.release();
      return result;
    } catch (error) {
      console.error('更新 NFT 上架状态失败:', error);
      throw error;
    }
  }

  // 更新 NFT 所有者
  async updateOwner(tokenId: number, newOwner: string) {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        'UPDATE nfts SET owner = ?, is_listed = false WHERE token_id = ?',
        [newOwner, tokenId]
      );
      connection.release();
      return result;
    } catch (error) {
      console.error('更新 NFT 所有者失败:', error);
      throw error;
    }
  }

  // 获取所有 NFT
  async getAllNFTs(): Promise<NFT[]> {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute<mysql.RowDataPacket[]>('SELECT * FROM nfts');
      connection.release();
      return rows as NFT[];
    } catch (error) {
      console.error('获取所有 NFT 失败:', error);
      throw error;
    }
  }

  // 获取指定 NFT
  async getNFTByTokenId(tokenId: number): Promise<NFT | null> {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM nfts WHERE token_id = ?',
        [tokenId]
      );
      connection.release();
      return (rows[0] as NFT) || null;
    } catch (error) {
      console.error('获取指定 NFT 失败:', error);
      throw error;
    }
  }

  // 获取用户拥有的 NFT
  async getNFTsByOwner(ownerAddress: string): Promise<NFT[]> {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM nfts WHERE owner = ?',
        [ownerAddress]
      );
      connection.release();
      return rows as NFT[];
    } catch (error) {
      console.error('获取用户 NFT 失败:', error);
      throw error;
    }
  }

  // 获取已上架的 NFT
  async getListedNFTs(): Promise<NFT[]> {
    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        'SELECT * FROM nfts WHERE is_listed = true'
      );
      connection.release();
      return rows as NFT[];
    } catch (error) {
      console.error('获取上架 NFT 失败:', error);
      throw error;
    }
  }
}

export const nftService = new NFTService();
