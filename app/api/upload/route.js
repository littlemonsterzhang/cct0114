import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';//用来save image to supabase

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

  // Get user session from Supabase auth
  async function getUserSession() {
    const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
    const { cookies } = await import('next/headers');
    
    const supabase = createServerComponentClient({ cookies });
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      throw new Error('Unauthorized');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.full_name || session.user.email
    };
  }


// 保存文件元数据的函数
async function saveFileMetadata(file, userInfo) {
    const { name, size, type } = file; // 从文件对象中获取元数据
    const uploadedAt = new Date().toISOString(); // 当前时间
    const { data, error } = await supabase.from('files_metadata').insert([
      {
        file_name: name,
        file_size: size,
        file_type: type,
        uploaded_at: uploadedAt,
        user_id: userInfo.id,
        user_email: userInfo.email,
        user_name: userInfo.name,
      },
    ]);
  
    if (error) {
      console.error('保存文件元数据失败:', error.message);
      return;
    }
  
    console.log('文件元数据保存成功:', data);
  }



export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userInfo = await getUserSession(); // You'll need to implement this function

    if (!file) {
      return NextResponse.json(
        { error: 'No file received' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public directory
    const path = join('public', 'uploads', file.name);
    await writeFile(path, buffer);

    // Here you would typically:
    // 1. Generate a unique filename
    // 2. Save file metadata to your database
    // 3. Associate the upload with the logged-in user
    // 示例：上传文件并保存元数据
    console.log('Processing request:', userInfo);

    if (file) {
        // await saveFileMetadata(file, userInfo);
        await saveFileMetadata(file,userInfo);
    }
    

    return NextResponse.json({ 
      message: 'Upload successful',
      path: `/uploads/${file.name}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
