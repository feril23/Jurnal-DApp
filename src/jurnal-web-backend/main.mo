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
        reviews: [Review];
    };

    public type Profile = {
        name: Text;
        expertise: Text; // Bidang keahlian, misal: "Computer Science", "Biology"
        reviewingCount: Nat;
        reputation: Nat;
        principal: Principal;
    };

    public type ReviewDecision = {
        #accept;
        #reject;
        #revise; 
    };

    public type Review = {
        reviewer: Principal;
        decision: ReviewDecision;
        comments: Text;
        timestamp: Time.Time;
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
            reputation = 0;
            principal = caller;
        };
        
        // Simpan ke RBTree
        let result = profiles.put(caller, newProfile);
        
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
        Debug.print("=== RECHECK PENDING ASSIGNMENTS ===");
        Debug.print("New reviewer: " # newReviewerProfile.name # " | Expertise: " # newReviewerProfile.expertise);
        
        // Cari artikel yang masih membutuhkan reviewer tambahan
        let allArticles = Iter.toArray(articles.entries());
        var recheckCount = 0;
        
        for ((articleId, article) in allArticles.vals()) {
            // Hanya cek artikel yang statusnya submitted atau in_review tapi belum cukup reviewer
            let needsMoreReviewers = (article.status == #submitted and article.reviewers.size() < 2) or
                                    (article.status == #in_review and article.reviewers.size() < 3);
            
            if (needsMoreReviewers) {
                // Cek apakah reviewer baru cocok dengan artikel ini
                var hasMatch = false;
                for (keyword in article.keywords.vals()) {
                    if (containsKeyword(newReviewerProfile.expertise, keyword)) {
                        hasMatch := true;
                    };
                };
                
                // Pastikan bukan author dan belum ditugaskan
                let isNotAuthor = article.author != newReviewerProfile.principal;
                let notAlreadyAssigned = Array.find<Principal>(article.reviewers, func(p) { p == newReviewerProfile.principal }) == null;
                
                if (hasMatch and isNotAuthor and notAlreadyAssigned) {
                    Debug.print("🔄 Re-checking assignment for article #" # Nat.toText(articleId) # ": " # article.title);
                    
                    // Panggil autoAssignReviewers untuk artikel ini
                    let assignmentResult = await autoAssignReviewers(articleId);
                    recheckCount += 1;
                    
                    switch(assignmentResult) {
                        case (#ok(updatedArticle)) {
                            Debug.print("✅ Successfully updated article #" # Nat.toText(articleId) # " with new reviewer assignments");
                        };
                        case (#err(msg)) {
                            Debug.print("⚠️ Could not update article #" # Nat.toText(articleId) # ": " # msg);
                        };
                    };
                };
            };
        };
        
        Debug.print("Rechecked " # Nat.toText(recheckCount) # " articles for new reviewer assignment.");
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
                    reviews = article.reviews;
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
                    reviews = article.reviews;
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
            reviews = [];
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
                    reviews = article.reviews;
                    status = newStatus;
                };
                articles.put(id, updatedArticle);
                return #ok(updatedArticle);
            };
        };
    };

    public shared (caller) func submitReview(
        articleId: ArticleId,
        decision: ReviewDecision,
        comments: Text
    ) : async Result.Result<Article, Text> {
        
        let article = switch (articles.get(articleId)) {
            case null { return #err("Artikel tidak ditemukan."); };
            case (?a) { a };
        };

        let isAssignedReviewer = Array.find<Principal>(article.reviewers, func(p) { p == caller.caller }) != null;
        if (not isAssignedReviewer) {
            return #err("Anda tidak ditugaskan untuk mereview artikel ini.");
        };

        if (article.status != #in_review) {
            return #err("Artikel ini tidak sedang dalam status 'in_review'.");
        };

        // Cek duplikat review dari reviewer yang sama
        let existingReview = Array.find<Review>(article.reviews, func(r) { r.reviewer == caller.caller });
        if (existingReview != null) {
            return #err("Anda sudah pernah men-submit review untuk artikel ini.");
        };
        
        let newReview: Review = {
            reviewer = caller.caller;
            decision = decision;
            comments = comments;
            timestamp = Time.now();
        };

        // Tambahkan review baru ke array yang sudah ada
        let updatedReviews = Array.append(article.reviews, [newReview]);
        
        switch(profiles.get(caller.caller)) {
            case null {}; // Seharusnya tidak terjadi, karena sudah divalidasi saat assign
            case (?profile) {
                let updatedProfile = { 
                    name = profile.name;
                    expertise = profile.expertise;
                    principal = profile.principal;
                    reviewingCount = if (profile.reviewingCount > 0) profile.reviewingCount - 1 else 0;
                    reputation = profile.reputation + 10;
                };
                profiles.put(caller.caller, updatedProfile);
            };
        };

        let updatedArticle : Article = {
            id = article.id;
            title = article.title;
            author = article.author;
            contentHash = article.contentHash;
            submissionTime = article.submissionTime;
            status = article.status;
            reviewers = article.reviewers;
            keywords = article.keywords;
            reviews = updatedReviews;
        };

        let finalArticle = checkAndFinalizeStatus(updatedArticle);

        articles.put(articleId, finalArticle);
        return #ok(finalArticle);
    };

    private func checkAndFinalizeStatus(article: Article) : Article {
        let minReviews : Nat = 3;

        // 1. Cek apakah jumlah review sudah mencukupi
        if (article.reviews.size() < minReviews) {
            return article; // Jika belum, kembalikan artikel tanpa perubahan
        };

        // 2. Hitung jumlah setiap keputusan
        var acceptCount : Nat = 0;
        var rejectCount : Nat = 0;
        for (review in article.reviews.vals()) {
            switch (review.decision) {
                case (#accept) { acceptCount += 1; };
                case (#reject) { rejectCount += 1; };
                case (#revise) { /* Abaikan untuk saat ini */ };
            };
        };

        // 3. Terapkan aturan keputusan
        var finalStatus = article.status;
        if (rejectCount >= 2) {
            finalStatus := #rejected; // Jika ada min 2 penolakan, reject
            Debug.print("Keputusan final: Artikel #" # Nat.toText(article.id) # " ditolak.");
        } else if (acceptCount >= 2) {
            finalStatus := #accepted; // Jika ada min 2 menerima, accept
            Debug.print("Keputusan final: Artikel #" # Nat.toText(article.id) # " diterima.");
        };
        
        // 4. Kembalikan artikel dengan status yang mungkin sudah final
        return {
            id = article.id;
            title = article.title;
            author = article.author;
            contentHash = article.contentHash;
            submissionTime = article.submissionTime;
            reviewers = article.reviewers;
            keywords = article.keywords;
            reviews = article.reviews;
            status = finalStatus;
        };
    };

    // 3. Fungsi autoAssignReviewers yang diperbaiki
    public shared (msg) func autoAssignReviewers(articleId: ArticleId) : async Result.Result<Article, Text> {
        
        // 1. Ambil data artikel
        let article = switch (articles.get(articleId)) {
            case null { return #err("Artikel tidak ditemukan."); };
            case (?a) { a };
        };

        // Konfigurasi reviewer assignment
        let maxReviewers = 3;
        let minReviewers = 1; // Minimum reviewer yang harus ada
        let targetReviewers = 3; // Target ideal reviewer
        
        // Cek apakah artikel sudah memiliki reviewer maksimal
        if (article.reviewers.size() >= maxReviewers) {
            return #err("Artikel sudah memiliki reviewer maksimal (" # Nat.toText(maxReviewers) # " reviewer).");
        };

        let author = article.author;
        let currentReviewerCount = article.reviewers.size();
        let reviewersNeeded = targetReviewers - currentReviewerCount;

        Debug.print("=== AUTO ASSIGN REVIEWERS ===");
        Debug.print("Artikel ID: " # Nat.toText(articleId));
        Debug.print("Current reviewers: " # Nat.toText(currentReviewerCount));
        Debug.print("Reviewers needed: " # Nat.toText(reviewersNeeded));

        // 2. Ambil semua calon reviewer dan buat scoring yang lebih canggih
        let allProfileEntries = Iter.toArray(profiles.entries());
        let allProfiles = Array.map<(Principal, Profile), Profile>(
            allProfileEntries, 
            func((_, profile)) { profile }
        );

        // 3. Sistem Scoring yang Diperbaiki
        let scoredReviewersBuffer = Buffer.Buffer<(Profile, Nat)>(0);
        
        for (profile in allProfiles.vals()) {
            // Terapkan aturan dasar: bukan penulis & belum ditugaskan
            let isAuthor = profile.principal == author;
            let isAlreadyAssigned = Array.find<Principal>(article.reviewers, func(p){ p == profile.principal}) != null;
            
            if (not isAuthor and not isAlreadyAssigned) {
                var score : Nat = 0;
                var hasExpertiseMatch = false;
                
                // 1. SCORING BERDASARKAN KECOCOKAN EXPERTISE
                for (keyword in article.keywords.vals()) {
                    if (containsKeyword(profile.expertise, keyword)) {
                        score += 15; // Skor base untuk kecocokan
                        hasExpertiseMatch := true;
                        
                        // Bonus untuk exact match
                        if (Text.equal(profile.expertise, keyword)) {
                            score += 10;
                        };
                    };
                };
                
                // 2. HANYA KANDIDAT DENGAN EXPERTISE MATCH YANG DIPERTIMBANGKAN
                if (hasExpertiseMatch) {
                    // 3. SCORING BERDASARKAN BEBAN KERJA (Workload balancing)
                    let workloadScore = if (profile.reviewingCount == 0) {
                        20 // Bonus besar untuk reviewer yang belum pernah review
                    } else if (profile.reviewingCount < 3) {
                        15 // Bonus sedang untuk reviewer dengan beban rendah
                    } else if (profile.reviewingCount < 7) {
                        10 // Bonus kecil untuk reviewer dengan beban sedang
                    } else if (profile.reviewingCount < 15) {
                        5  // Skor minimal untuk reviewer dengan beban tinggi
                    } else {
                        0  // Tidak ada bonus untuk reviewer yang overload
                    };
                    
                    score += workloadScore;
                    
                    // 4. BONUS UNTUK DIVERSITY (mencegah reviewer yang sama terus-menerus)
                    // Implementasi sederhana: beri bonus jika reviewer belum banyak mereview artikel dari author yang sama
                    // (Bisa ditambahkan logika lebih kompleks di masa depan)
                    
                    Debug.print("Kandidat reviewer: " # profile.name # " | Score: " # Nat.toText(score) # " | Workload: " # Nat.toText(profile.reviewingCount));
                    scoredReviewersBuffer.add((profile, score));
                };
            };
        };

        let scoredReviewers = Buffer.toArray(scoredReviewersBuffer);
        
        if (scoredReviewers.size() == 0) {
            // Tidak ada reviewer yang cocok ditemukan
            Debug.print("Tidak ada reviewer dengan expertise yang cocok. Artikel akan masuk ke waiting list.");
            return #err("Tidak ada reviewer dengan expertise yang cocok. Artikel akan ditugaskan otomatis ketika ada reviewer baru yang sesuai.");
        };

        // 4. SORTING - Urutkan berdasarkan skor tertinggi
        let sortedReviewers = Array.sort<(Profile, Nat)>(
            scoredReviewers, 
            func(a, b) { 
                if (a.1 > b.1) { #less }
                else if (a.1 < b.1) { #greater }
                else { #equal }
            }
        );
        
        // 5. SMART ASSIGNMENT STRATEGY
        let availableReviewers = sortedReviewers.size();
        let reviewersToAssign = if (availableReviewers >= reviewersNeeded) {
            // Jika ada cukup reviewer, assign sesuai target
            reviewersNeeded
        } else if (availableReviewers >= minReviewers and currentReviewerCount == 0) {
            // Jika tidak cukup untuk target tapi cukup untuk minimum, assign semua yang ada
            availableReviewers
        } else if (currentReviewerCount + availableReviewers >= minReviewers) {
            // Jika dengan reviewer saat ini bisa mencapai minimum, assign semua yang ada
            availableReviewers  
        } else {
            // Tidak cukup reviewer, tapi tetap assign yang ada
            availableReviewers
        };

        if (reviewersToAssign == 0) {
            return #err("Tidak ada reviewer yang bisa ditugaskan saat ini.");
        };

        Debug.print("Akan menugaskan " # Nat.toText(reviewersToAssign) # " reviewer dari " # Nat.toText(availableReviewers) # " kandidat.");

        // 6. ASSIGN REVIEWERS
        let selectedReviewersBuffer = Buffer.fromArray<Principal>(article.reviewers);
        var assignedCount = 0;
        
        for (i in Iter.range(0, reviewersToAssign - 1)) {
            if (i < sortedReviewers.size()) {
                let (profile, score) = sortedReviewers[i];
                selectedReviewersBuffer.add(profile.principal);
                
                // Update beban kerja reviewer
                let updatedProfile: Profile = {
                    name = profile.name;
                    expertise = profile.expertise;
                    principal = profile.principal;
                    reputation = profile.reputation;
                    reviewingCount = profile.reviewingCount + 1;
                };
                profiles.put(profile.principal, updatedProfile);
                
                assignedCount += 1;
                Debug.print("✓ Reviewer ditugaskan: " # profile.name # " | Score: " # Nat.toText(score) # " | Expertise: " # profile.expertise);
            };
        };

        // 7. UPDATE ARTIKEL
        let finalReviewerCount = selectedReviewersBuffer.size();
        let newStatus = if (finalReviewerCount >= minReviewers) {
            #in_review
        } else {
            #submitted // Tetap submitted jika belum cukup reviewer
        };

        let updatedArticle : Article = {
            id = article.id;
            title = article.title;
            author = article.author;
            contentHash = article.contentHash;
            submissionTime = article.submissionTime;
            keywords = article.keywords;
            reviewers = Buffer.toArray(selectedReviewersBuffer);
            reviews = article.reviews;
            status = newStatus;
        };

        articles.put(articleId, updatedArticle);

        // 8. LOGGING HASIL
        Debug.print("=== ASSIGNMENT COMPLETED ===");
        Debug.print("Total reviewers assigned: " # Nat.toText(assignedCount));
        Debug.print("Final reviewer count: " # Nat.toText(finalReviewerCount));
        Debug.print("Article status: " # (if (newStatus == #in_review) "IN_REVIEW" else "SUBMITTED"));
        
        if (finalReviewerCount < targetReviewers) {
            Debug.print("⚠️ Artikel belum mencapai target " # Nat.toText(targetReviewers) # " reviewer. Akan ditugaskan otomatis ketika ada reviewer baru yang sesuai.");
        };

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