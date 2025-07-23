// File: src/jurnal_final_backend/main.mo

import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import RBTree "mo:base/RBTree";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Char "mo:base/Char";

actor JurnalFinal {

    // =====================================================================
    // 1. TIPE DATA
    // =====================================================================

    public type ArticleId = Nat;
    private var dataVersion : Nat = 0;

    public type ArticleStatus = {
        #submitted;
        #in_review;
        #accepted;
        #rejected;
    };

    public type Article = {
        id: ArticleId;
        title: Text;
        author: Principal;
        contentHash: Text; 
        submissionTime: Time.Time;
        status: ArticleStatus;
        reviewers: [Principal];
        keywords: [Text];
    };

    public type Profile = {
        name: Text;
        expertise: Text; // Bidang keahlian, misal: "Computer Science", "Biology"
        reviewingCount: Nat;
        principal: Principal;
    };

    // =====================================================================
    // 2. PENYIMPANAN DATA STABIL
    // =====================================================================

    private stable var nextArticleId: ArticleId = 1;

    // stable storage
    private stable var articlesEntries: [(ArticleId, Article)] = [];
    private stable var profilesEntries: [(Principal, Profile)] = [];
    private stable var unassignedArticleIdsEntries: [ArticleId] = [];

    // in-memory structures
    private var articles: RBTree.RBTree<ArticleId, Article> = 
        RBTree.RBTree<ArticleId, Article>(Nat.compare);

    private var profiles: RBTree.RBTree<Principal, Profile> = 
        RBTree.RBTree<Principal, Profile>(Principal.compare);

    private var unassignedArticleIds: [ArticleId] = [];

    // Pre-upgrade: simpan data
    system func preupgrade() {
        articlesEntries := Iter.toArray(articles.entries());
        profilesEntries := Iter.toArray(profiles.entries());
        unassignedArticleIdsEntries := unassignedArticleIds;
    };

    // Post-upgrade: restore data
    system func postupgrade() {
        articles := RBTree.RBTree<ArticleId, Article>(Nat.compare);
        profiles := RBTree.RBTree<Principal, Profile>(Principal.compare);
        unassignedArticleIds := unassignedArticleIdsEntries;

        for ((id, article) in articlesEntries.vals()) {
            articles.put(id, article);
        };

        for ((principal, profile) in profilesEntries.vals()) {
            profiles.put(principal, profile);
        };

        // clear stable storage
        articlesEntries := [];
        profilesEntries := [];
        unassignedArticleIdsEntries := [];
    };

    // =====================================================================
    // 4. FUNGSI LOGIKA - DIPERBAIKI
    // =====================================================================

    public shared (msg) func registerProfile(name: Text, expertise: Text, reviewingCount: Nat) : async Result.Result<Profile, Text> {
        
        // LANGKAH DEBUG: Cetak data yang diterima ke terminal dfx
        Debug.print("=== REGISTER PROFILE ===");
        Debug.print("Caller: " # Principal.toText(msg.caller));
        Debug.print("Name: '" # name # "'");
        Debug.print("Expertise: '" # expertise # "'");
        Debug.print("Is Anonymous: " # (if (Principal.isAnonymous(msg.caller)) "Yes" else "No"));

        let caller = msg.caller;
        
        // Cek jika sudah ada profil
        switch (profiles.get(caller)) {
            case (?existingProfile) {
                let errMsg = "Anda sudah memiliki profil: " # existingProfile.name;
                Debug.print("ERROR: " # errMsg);
                return #err(errMsg);
            };
            case null {
                // Lanjutkan proses registrasi
            };
        };

        // Validasi input
        if (name == "" or expertise == "") {
            let errMsg = "Nama dan expertise tidak boleh kosong";
            Debug.print("ERROR: " # errMsg);
            return #err(errMsg);
        };

        // Membuat profil baru
        let newProfile: Profile = {
            name = name;
            expertise = expertise;
            reviewingCount = reviewingCount;
            principal = caller;
        };
        
        // Simpan ke RBTree
        profiles.put(caller, newProfile);
        
        Debug.print("✓ Profil berhasil disimpan!");
        Debug.print("Total profiles sekarang: " # Nat.toText(Iter.size(profiles.entries())));
        
        await recheckUnassignedArticles(newProfile);
        dataVersion += 1; 

        return #ok(newProfile);
    };

    public query func getDataVersion() : async Nat {
        return dataVersion;
    };

    private func recheckUnassignedArticles(newReviewerProfile: Profile) : async () {
        Debug.print("Memicu pengecekan ulang untuk reviewer baru: " # newReviewerProfile.name);
        
        // Buat daftar baru untuk menampung ID yang masih belum ter-assign
        let remainingUnassigned = Buffer.Buffer<ArticleId>(0);

        // BENAR: Iterasi menggunakan .vals() pada array unassignedArticleIds
        for (articleId in unassignedArticleIds.vals()) {
            switch (articles.get(articleId)) {
                case null {
                    // Artikel mungkin telah dihapus, abaikan saja dari daftar tunggu
                    Debug.print("Peringatan: Artikel dengan ID #" # Nat.toText(articleId) # " di daftar tunggu tidak ditemukan di database.");
                };
                case (?article) {
                    // Cek kecocokan antara artikel dan reviewer baru
                    var isMatch = false;
                    for (keyword in article.keywords.vals()) {
                        if (containsKeyword(newReviewerProfile.expertise, keyword)) {
                            isMatch := true;
                        };
                    };

                    if (isMatch) {
                        // Jika cocok, panggil fungsi autoAssignReviewers
                        Debug.print("Kecocokan ditemukan! Mencoba menugaskan " # newReviewerProfile.name # " ke artikel #" # Nat.toText(article.id));
                        
                        // Panggil fungsi autoAssignReviewers yang sudah ada
                        let assignmentResult = await autoAssignReviewers(article.id);
                        
                        switch(assignmentResult) {
                            case (#ok(_)) {
                            Debug.print("✓ Penugasan otomatis berhasil untuk artikel #" # Nat.toText(article.id));
                            // Karena sudah berhasil ditugaskan, JANGAN masukkan lagi ke daftar tunggu
                            };
                            case (#err(msg)) {
                            Debug.print("Penugasan otomatis belum selesai untuk artikel #" # Nat.toText(article.id) # ": " # msg);
                            // Mungkin reviewer yang cocok sudah penuh, tetap masukkan ke daftar tunggu
                            remainingUnassigned.add(articleId);
                            }
                        }
                    } else {
                        // Jika tidak cocok, masukkan kembali ke daftar tunggu untuk lain waktu
                        remainingUnassigned.add(articleId);
                    };
                };
            };
        };

        // Update daftar tunggu dengan ID yang tersisa
        unassignedArticleIds := Buffer.toArray(remainingUnassigned);
    };

    // PERBAIKAN UTAMA: Fungsi getProfile yang benar
    public query func getProfile(targetPrincipal: Principal) : async ?Profile {
        Debug.print("=== GET PROFILE ===");
        Debug.print("Looking for: " # Principal.toText(targetPrincipal));
        
        let result = profiles.get(targetPrincipal);
        switch (result) {
            case (?profile) {
                Debug.print("✓ Profile found: " # profile.name);
                return ?profile;
            };
            case null {
                Debug.print("✗ Profile not found");
                return null;
            };
        };
    };

    // PERBAIKAN: Fungsi getReviewers yang benar - mengembalikan array Profile, bukan tuple
    public query func getReviewers() : async [Profile] {
        let entries = profiles.entries();
        return Array.map<(Principal, Profile), Profile>(
            Iter.toArray(entries), 
            func((_, profile)) { profile }
        );
    };

    // PERBAIKAN: Fungsi assignReviewer - menggunakan Buffer untuk mengelola array dinamis
    public shared (msg) func assignReviewer(articleId: ArticleId, reviewerId: Principal) : async Result.Result<Article, Text> {
        // Cek apakah artikelnya ada
        switch(articles.get(articleId)) {
            case null { return #err("Artikel tidak ditemukan."); };
            case (?article) {
                // Cek apakah calon reviewer punya profil
                if (profiles.get(reviewerId) == null) {
                    return #err("Calon reviewer tidak memiliki profil.");
                };

                // Cek apakah reviewer sudah pernah ditugaskan
                let isAlreadyAssigned = Array.find<Principal>(article.reviewers, func(p) { p == reviewerId });
                if (isAlreadyAssigned != null) {
                    return #err("Reviewer ini sudah ditugaskan untuk artikel ini.");
                };

                // Tambahkan reviewer baru ke daftar menggunakan Buffer
                let reviewerBuffer = Buffer.fromArray<Principal>(article.reviewers);
                reviewerBuffer.add(reviewerId);

                // Buat record artikel yang sudah diupdate
                let updatedArticle : Article = {
                    id = article.id;
                    title = article.title;
                    author = article.author;
                    contentHash = article.contentHash;
                    submissionTime = article.submissionTime;
                    keywords = article.keywords;
                    reviewers = Buffer.toArray(reviewerBuffer); // Update daftar reviewer
                    status = #in_review; // Otomatis ubah status menjadi 'in_review'
                };

                // Simpan artikel yang sudah diupdate
                articles.put(articleId, updatedArticle);
                return #ok(updatedArticle);
            };
        };
    };

    // PERBAIKAN: Fungsi untuk menghapus reviewer dari artikel
    public shared (msg) func removeReviewer(articleId: ArticleId, reviewerId: Principal) : async Result.Result<Article, Text> {
        switch(articles.get(articleId)) {
            case null { return #err("Artikel tidak ditemukan."); };
            case (?article) {
                // Cek apakah reviewer ada dalam daftar
                let filteredReviewers = Array.filter<Principal>(article.reviewers, func(p) { p != reviewerId });
                
                if (filteredReviewers.size() == article.reviewers.size()) {
                    return #err("Reviewer tidak ditemukan dalam artikel ini.");
                };

                // Buat record artikel yang sudah diupdate
                let updatedArticle : Article = {
                    id = article.id;
                    title = article.title;
                    author = article.author;
                    contentHash = article.contentHash;
                    submissionTime = article.submissionTime;
                    keywords = article.keywords;
                    reviewers = filteredReviewers;
                    status = if (filteredReviewers.size() == 0) #submitted else #in_review;
                };

                articles.put(articleId, updatedArticle);
                return #ok(updatedArticle);
            };
        };
    };

    // Fungsi untuk debugging - lihat semua profile
    public query func getAllProfiles() : async [Profile] {
        Debug.print("=== GET ALL PROFILES ===");
        let entries = profiles.entries();
        let profileArray = Array.map<(Principal, Profile), Profile>(
            Iter.toArray(entries), 
            func((_, profile)) { profile }
        );
        Debug.print("Total profiles: " # Nat.toText(profileArray.size()));
        return profileArray;
    };

    // Fungsi untuk cek identity caller
    public shared (msg) func whoAmI() : async Text {
        let caller = msg.caller;
        let hasProfile = switch (profiles.get(caller)) {
            case null { "No" };
            case (?_) { "Yes" };
        };
        
        return "Principal: " # Principal.toText(caller) # 
               " | Anonymous: " # (if (Principal.isAnonymous(caller)) "Yes" else "No") #
               " | Has Profile: " # hasProfile;
    };

    // Fungsi debug lengkap
    public shared(msg) func debugWhoAmI() : async {
        caller: Text;
        isAnonymous: Bool;
        hasProfile: Bool;
        profileData: ?Profile;
    } {
        let caller = msg.caller;
        let profileData = profiles.get(caller);
        let hasProfile = switch (profileData) {
            case null { false };
            case (?_) { true };
        };
        
        Debug.print("=== DEBUG WHO AM I ===");
        Debug.print("Caller: " # Principal.toText(caller));
        Debug.print("Anonymous: " # (if (Principal.isAnonymous(caller)) "Yes" else "No"));
        Debug.print("Has Profile: " # (if (hasProfile) "Yes" else "No"));
        
        return {
            caller = Principal.toText(caller);
            isAnonymous = Principal.isAnonymous(caller);
            hasProfile = hasProfile;
            profileData = profileData;
        };
    };

    // FUNGSI ARTIKEL - Diperbaiki
    public shared (msg) func submitArticle(title: Text, contentHash: Text, keywords: [Text]) : async Result.Result<ArticleId, Text> {
        if (title == "" or contentHash == "") {
            return #err("Title dan content hash tidak boleh kosong");
        };
        
        if (keywords.size() == 0) {
            return #err("Minimal satu keyword diperlukan");
        };

        let author: Principal = msg.caller;
        let submittedId = nextArticleId;

        let newArticle: Article = {
            id = submittedId;
            title = title;
            author = author;
            contentHash = contentHash;
            submissionTime = Time.now();
            status = #submitted;
            reviewers = [];
            keywords = keywords;
        };

        articles.put(newArticle.id, newArticle);
        nextArticleId += 1;

        let assignResult = await autoAssignReviewers(submittedId);

        // Cek jika auto-assign gagal menemukan reviewer
        switch(assignResult) {
            case (#ok(_)) {
                // Berhasil, tidak perlu lakukan apa-apa
                Debug.print("Auto-assign berhasil untuk artikel #" # Nat.toText(submittedId));
            };
            case (#err(msg)) {
                // Gagal (kemungkinan tidak ada reviewer cocok), tambahkan ke daftar tunggu
                // Kita perlu menambahkan `unassignedArticleIds` dan logicnya jika belum ada
                Debug.print("Auto-assign gagal: " # msg);
                unassignedArticleIds := Array.append(unassignedArticleIds, [submittedId]);
            };
        };

        return #ok(submittedId);
    };

    public query func getArticle(id: ArticleId) : async ?Article {   
        return articles.get(id);
    };

    // PERBAIKAN: Update artikel status dengan validasi reviewer
    public shared (msg) func updateArticleStatus(id: ArticleId, newStatus: ArticleStatus) : async Result.Result<Article, Text> {
        switch (articles.get(id)) {
            case null { 
                return #err("Artikel tidak ditemukan"); 
            };
            case (?article) {
                // Validasi: hanya author yang bisa update ke submitted/rejected
                // Reviewer bisa update ke accepted/rejected jika mereka assigned
                let caller = msg.caller;
                let isAuthor = article.author == caller;
                let isAssignedReviewer = Array.find<Principal>(article.reviewers, func(p) { p == caller }) != null;
                
                if (not isAuthor and not isAssignedReviewer) {
                    return #err("Anda tidak memiliki izin untuk mengubah status artikel ini");
                };

                let updatedArticle: Article = {
                    id = article.id;
                    title = article.title;
                    author = article.author;
                    contentHash = article.contentHash;
                    submissionTime = article.submissionTime;
                    keywords = article.keywords;
                    reviewers = article.reviewers;
                    status = newStatus;
                };
                articles.put(id, updatedArticle);
                return #ok(updatedArticle);
            };
        };
    };

    // 3. Fungsi autoAssignReviewers yang diperbaiki
    public shared (msg) func autoAssignReviewers(articleId: ArticleId) : async Result.Result<Article, Text> {
        
        // 1. Ambil data artikel
        let article = switch (articles.get(articleId)) {
            case null { return #err("Artikel tidak ditemukan."); };
            case (?a) { a };
        };

        // Cek apakah artikel sudah memiliki reviewer maksimal (misal 3 reviewer)
        let maxReviewers = 3;
        if (article.reviewers.size() >= maxReviewers) {
            return #err("Artikel sudah memiliki reviewer maksimal.");
        };

        // Aturan: Jangan tugaskan penulisnya sendiri
        let author = article.author;

        // 2. Ambil semua calon reviewer - PERBAIKAN: gunakan entries() bukan values()
        let allProfileEntries = Iter.toArray(profiles.entries());
        let allProfiles = Array.map<(Principal, Profile), Profile>(
            allProfileEntries, 
            func((_, profile)) { profile }
        );

        // 3. Filter dan Hitung Skor (Scoring)
        let scoredReviewersBuffer = Buffer.Buffer<(Profile, Nat)>(0);
        
        for (profile in allProfiles.vals()) {
            // Terapkan aturan: bukan si penulis & belum pernah ditugaskan
            let isAuthor = profile.principal == author;
            let isAlreadyAssigned = Array.find<Principal>(article.reviewers, func(p){ p == profile.principal}) != null;
            
            if (not isAuthor and not isAlreadyAssigned) {

                // Algoritma Scoring yang Diperbaiki
                var score : Nat = 0;
                
                // 1. Skor berdasarkan kecocokan expertise dengan keywords
                for (keyword in article.keywords.vals()) {
                    if (containsKeyword(profile.expertise, keyword)) {
                        score += 10; // Beri skor hanya jika ada kecocokan
                    };
                };
                
                // 2. HANYA JIKA ADA KECOCOKAN (score > 0), pertimbangkan sebagai kandidat
                if (score > 0) {
                    // Berikan bonus skor berdasarkan beban kerja
                    let workloadScore = if (profile.reviewingCount < 10) {
                        10 - profile.reviewingCount
                    } else { 0 };
                    score += workloadScore;

                    // Tambahkan reviewer yang valid ke daftar kandidat
                    scoredReviewersBuffer.add((profile, score));
                };
            };
        };

        let scoredReviewers = Buffer.toArray(scoredReviewersBuffer);

        // 4. Urutkan reviewer dari skor tertinggi ke terendah
        let sortedReviewers = Array.sort<(Profile, Nat)>(
            scoredReviewers, 
            func(a, b) { 
                if (a.1 > b.1) { #less }
                else if (a.1 < b.1) { #greater }
                else { #equal }
            }
        );
        
        // 5. Pilih reviewer yang dibutuhkan (maksimal 2 baru)
        let currentReviewerCount = article.reviewers.size();
        let reviewersToAdd = Nat.min(2, maxReviewers - currentReviewerCount);
        let availableReviewers = Nat.min(reviewersToAdd, sortedReviewers.size());
        
        if (availableReviewers == 0) {
            return #err("Tidak ada reviewer yang cocok ditemukan.");
        };

        // 6. Tambahkan reviewer baru
        let selectedReviewersBuffer = Buffer.fromArray<Principal>(article.reviewers);
        
        for (i in Iter.range(0, availableReviewers - 1)) {
            let (profile, score) = sortedReviewers[i];
            selectedReviewersBuffer.add(profile.principal);
            
            // Update beban kerja reviewer
            let updatedProfile: Profile = {
                name = profile.name;
                expertise = profile.expertise;
                principal = profile.principal;
                reviewingCount = profile.reviewingCount + 1;
            };
            profiles.put(profile.principal, updatedProfile);
            
            Debug.print("Reviewer ditugaskan: " # profile.name # " (Score: " # Nat.toText(score) # ")");
        };

        // 7. Update artikel dengan reviewer baru dan status
        let updatedArticle : Article = {
            id = article.id;
            title = article.title;
            author = article.author;
            contentHash = article.contentHash;
            submissionTime = article.submissionTime;
            keywords = article.keywords;
            reviewers = Buffer.toArray(selectedReviewersBuffer);
            status = #in_review;
        };

        articles.put(articleId, updatedArticle);
        return #ok(updatedArticle);
    };

    func toLower(text: Text) : Text {
        let chars = Text.toIter(text);
        let lowered = Iter.map<Char, Char>(chars, func(c: Char) : Char {
            if (c >= 'A' and c <= 'Z') {
            Char.fromNat32(Char.toNat32(c) + 32)
            } else {
            c
            }
        });
        Text.fromIter(lowered)
    };

    private func containsKeyword(expertise: Text, keyword: Text) : Bool {
        // Implementasi sederhana - bisa diperbaiki dengan Text.contains() jika tersedia
        let expertiseLower = toLower(expertise);
        
        let keywordLower = Text.map(keyword, func(c: Char) : Char {
            if (c >= 'A' and c <= 'Z') {
                Char.fromNat32(Char.toNat32(c) + 32)
            } else { c }
        });
        
        // Simple substring check - ini bisa diperbaiki dengan algoritma yang lebih baik
        return expertiseLower == keywordLower or 
        Text.startsWith(expertiseLower, #text keywordLower) or
        Text.endsWith(expertiseLower, #text keywordLower)
    };

    public shared (msg) func completeReview(articleId: ArticleId, reviewerId: Principal) : async Result.Result<Bool, Text> {
        // Cek apakah reviewer memang ditugaskan untuk artikel ini
        switch (articles.get(articleId)) {
            case null { return #err("Artikel tidak ditemukan."); };
            case (?article) {
                let isAssigned = Array.find<Principal>(article.reviewers, func(p) { p == reviewerId }) != null;
                if (not isAssigned) {
                    return #err("Reviewer tidak ditugaskan untuk artikel ini.");
                };
                
                // Update beban kerja reviewer (kurangi 1)
                switch (profiles.get(reviewerId)) {
                    case null { return #err("Profile reviewer tidak ditemukan."); };
                    case (?profile) {
                        let updatedProfile: Profile = {
                            name = profile.name;
                            expertise = profile.expertise;
                            principal = profile.principal;
                            reviewingCount = if (profile.reviewingCount > 0) profile.reviewingCount - 1 else 0;
                        };
                        profiles.put(reviewerId, updatedProfile);
                        return #ok(true);
                    };
                };
            };
        };
    };

    public query func getAllArticles() : async [Article] {
        let entries = articles.entries();
        return Array.map<(ArticleId, Article), Article>(
            Iter.toArray(entries), 
            func((_, article)) { article }
        );
    };

    public query func getArticlesByAuthor(author: Principal) : async [Article] {
        let allArticles = Iter.toArray(articles.entries());
        let filtered = Array.filter<(ArticleId, Article)>(
            allArticles, 
            func((_, article)) { article.author == author }
        );
        return Array.map<(ArticleId, Article), Article>(
            filtered, 
            func((_, article)) { article }
        );
    };

    public query func getArticlesByStatus(status: ArticleStatus) : async [Article] {
        let allArticles = Iter.toArray(articles.entries());
        let filtered = Array.filter<(ArticleId, Article)>(
            allArticles, 
            func((_, article)) { article.status == status }
        );
        return Array.map<(ArticleId, Article), Article>(
            filtered, 
            func((_, article)) { article }
        );
    };

    // PERBAIKAN: Fungsi untuk mendapatkan artikel yang perlu direview oleh user tertentu
    public query func getArticlesToReview(reviewer: Principal) : async [Article] {
        let allArticles = Iter.toArray(articles.entries());
        let filtered = Array.filter<(ArticleId, Article)>(
            allArticles, 
            func((_, article)) { 
                Array.find<Principal>(article.reviewers, func(p) { p == reviewer }) != null
            }
        );
        return Array.map<(ArticleId, Article), Article>(
            filtered, 
            func((_, article)) { article }
        );
    };

    public shared (msg) func deleteArticle(id: ArticleId) : async Result.Result<Bool, Text> {
        switch (articles.get(id)) {
            case null { 
                return #err("Artikel tidak ditemukan"); 
            };
            case (?article) {
                if (article.author == msg.caller) {
                    articles.delete(id);
                    return #ok(true);
                } else {
                    return #err("Hanya penulis yang dapat menghapus artikel");
                };
            };
        };
    };

    public query func getStats() : async {
        totalArticles: Nat;
        submittedCount: Nat;
        inReviewCount: Nat;
        acceptedCount: Nat;
        rejectedCount: Nat;
        totalProfiles: Nat;
    } {
        let allArticles = Iter.toArray(articles.entries());
        var submittedCount = 0;
        var inReviewCount = 0;
        var acceptedCount = 0;
        var rejectedCount = 0;

        for ((_, article) in allArticles.vals()) {
            switch (article.status) {
                case (#submitted) { submittedCount += 1; };
                case (#in_review) { inReviewCount += 1; };
                case (#accepted) { acceptedCount += 1; };
                case (#rejected) { rejectedCount += 1; };
            };
        };

        return {
            totalArticles = allArticles.size();
            submittedCount = submittedCount;
            inReviewCount = inReviewCount;
            acceptedCount = acceptedCount;
            rejectedCount = rejectedCount;
            totalProfiles = Iter.size(profiles.entries());
        };
    };
}