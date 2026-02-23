async function loadTrees() {
    const container = document.getElementById('treesContainer');
    container.innerHTML = '<div class="loading">Memuat ekosistem hutan...</div>';
    
    try {
        const res = await fetch('/api/trees', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Server Vercel Error ${res.status}`);
        
        const trees = await res.json();
        container.innerHTML = '';
        
        if(trees.length === 0) {
            container.innerHTML = '<p style="padding:20px;">Belum ada data pohon di database.</p>';
            return;
        }

        trees.forEach(tree => {
            let shortDesc = tree.description.length > 80 ? tree.description.substring(0, 80) + '...' : tree.description;
            container.innerHTML += `
                <div class="tree-card">
                    <img src="${tree.image_url}" alt="${tree.name}" loading="lazy">
                    <div class="tree-card-info">
                        <h3>${tree.name}</h3>
                        <p>${shortDesc}</p>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = `<p style="padding:20px; color:red; font-size: 0.9rem;">
            <b>Gagal memuat data: ${error.message}</b><br><br>
            Jika di Vercel: Pastikan Environment Variables (DATABASE_URL) sudah diatur dan lakukan Redeploy.
        </p>`;
    }
}