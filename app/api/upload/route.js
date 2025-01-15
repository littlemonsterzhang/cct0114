import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

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