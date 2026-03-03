

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_daily_comment_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM public.comments
  WHERE author_id = NEW.author_id
    AND created_at > now() - interval '1 day';

  IF daily_count >= 100 THEN
    RAISE EXCEPTION '일일 댓글 작성 한도(100건)를 초과했습니다.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_daily_comment_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_daily_post_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
DECLARE
  daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM public.posts
  WHERE author_id = NEW.author_id
    AND created_at > now() - interval '1 day';

  IF daily_count >= 50 THEN
    RAISE EXCEPTION '일일 게시글 작성 한도(50건)를 초과했습니다.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_daily_post_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_orphan_group_members"("days_inactive" integer DEFAULT 180) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  deleted_count integer;
  safe_days integer;
BEGIN
  -- 1일 미만·NULL·음수 방지 (의도치 않은 대량 삭제 방지)
  safe_days := GREATEST(COALESCE(NULLIF(days_inactive, 0), 180), 1);

  DELETE FROM public.group_members
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE is_anonymous = true
      AND (last_sign_in_at IS NULL OR last_sign_in_at < (now() - (safe_days || ' days')::interval))
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'cleanup_orphan_group_members: deleted % rows (days_inactive=%)', deleted_count, safe_days;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_orphan_group_members"("days_inactive" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_orphan_group_members"("days_inactive" integer) IS '오래 로그인하지 않은 익명 사용자의 group_members 행을 삭제합니다. 기본 180일. days_inactive 0/음수는 1로, NULL은 180으로 보정. 대시보드 SQL 또는 Edge Function에서 주기적으로 호출하세요.';



CREATE OR REPLACE FUNCTION "public"."get_emotion_trend"("days" integer DEFAULT 7) RETURNS TABLE("emotion" "text", "cnt" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(pa.emotions) AS emotion,
    COUNT(*)::BIGINT AS cnt
  FROM post_analysis pa
  WHERE pa.analyzed_at >= (now() - (days || ' days')::interval)
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 5;
END;
$$;


ALTER FUNCTION "public"."get_emotion_trend"("days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_emotion_trend"("days" integer) IS '최근 N일간 post_analysis에서 감정별 빈도를 집계해 상위 5개 반환. 기본 7일.';



CREATE OR REPLACE FUNCTION "public"."get_post_reactions"("p_post_id" bigint) RETURNS TABLE("reaction_type" "text", "count" integer, "user_reacted" boolean)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    r.reaction_type,
    r.count,
    EXISTS(
      SELECT 1 FROM user_reactions ur
      WHERE ur.post_id = p_post_id
      AND ur.user_id = auth.uid()
      AND ur.reaction_type = r.reaction_type
    ) as user_reacted
  FROM reactions r
  WHERE r.post_id = p_post_id;
$$;


ALTER FUNCTION "public"."get_post_reactions"("p_post_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recommended_posts_by_emotion"("p_post_id" bigint, "p_limit" integer DEFAULT 10) RETURNS TABLE("id" bigint, "title" "text", "board_id" bigint, "like_count" integer, "comment_count" integer, "emotions" "text"[], "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ DECLARE v_emotions TEXT[]; BEGIN SELECT COALESCE(pa.emotions, '{}') INTO v_emotions FROM post_analysis pa WHERE pa.post_id = p_post_id; IF array_length(v_emotions, 1) IS NULL OR array_length(v_emotions, 1) = 0 THEN RETURN; END IF; RETURN QUERY SELECT v.id, v.title, v.board_id, v.like_count, v.comment_count, v.emotions, v.created_at FROM posts_with_like_count v WHERE v.id != p_post_id AND v.group_id IS NULL AND v.emotions IS NOT NULL AND v.emotions && v_emotions ORDER BY (SELECT COUNT(*) FROM unnest(v.emotions) e WHERE e = ANY(v_emotions)) DESC, v.like_count DESC, v.created_at DESC LIMIT p_limit; END; $$;


ALTER FUNCTION "public"."get_recommended_posts_by_emotion"("p_post_id" bigint, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_recommended_posts_by_emotion"("p_post_id" bigint, "p_limit" integer) IS '지정한 글과 감정이 겹치는 다른 글을 일치 수·좋아요·최신순으로 반환. 추천 목록용.';



CREATE OR REPLACE FUNCTION "public"."soft_delete_comment"("p_comment_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE comments
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_comment_id AND author_id = auth.uid() AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot delete comment: not found, not authorized, or already deleted';
  END IF;
END;
$$;


ALTER FUNCTION "public"."soft_delete_comment"("p_comment_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_post"("p_post_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE posts
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_post_id AND author_id = auth.uid() AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot delete post: not found, not authorized, or already deleted';
  END IF;
END;
$$;


ALTER FUNCTION "public"."soft_delete_post"("p_post_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_reaction"("p_post_id" bigint, "p_type" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existed BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Try to delete existing user reaction
  DELETE FROM user_reactions
  WHERE user_id = v_user_id AND post_id = p_post_id AND reaction_type = p_type;
  v_existed := FOUND;

  IF v_existed THEN
    -- Decrement aggregate count
    UPDATE reactions SET count = count - 1
    WHERE post_id = p_post_id AND reaction_type = p_type;
    -- Clean up zero-count rows
    DELETE FROM reactions
    WHERE post_id = p_post_id AND reaction_type = p_type AND count <= 0;
  ELSE
    -- Insert user reaction
    INSERT INTO user_reactions(user_id, post_id, reaction_type)
    VALUES (v_user_id, p_post_id, p_type);
    -- Upsert aggregate count
    INSERT INTO reactions(post_id, reaction_type, count) VALUES (p_post_id, p_type, 1)
    ON CONFLICT (post_id, reaction_type) DO UPDATE SET count = reactions.count + 1;
  END IF;

  RETURN jsonb_build_object(
    'action', CASE WHEN v_existed THEN 'removed' ELSE 'added' END
  );
END;
$$;


ALTER FUNCTION "public"."toggle_reaction"("p_post_id" bigint, "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_admin" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_admin" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."boards" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "anon_mode" "text" DEFAULT 'allow_choice'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "group_id" bigint,
    CONSTRAINT "boards_anon_mode_check" CHECK (("anon_mode" = ANY (ARRAY['always_anon'::"text", 'allow_choice'::"text", 'require_name'::"text"]))),
    CONSTRAINT "boards_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "public"."boards" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."boards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."boards_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."boards_id_seq" OWNED BY "public"."boards"."id";



CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" bigint NOT NULL,
    "post_id" bigint NOT NULL,
    "content" "text" NOT NULL,
    "author" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "board_id" bigint,
    "group_id" bigint,
    "is_anonymous" boolean DEFAULT true NOT NULL,
    "display_name" "text" DEFAULT '익명'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "comments_content_length" CHECK (("length"("content") <= 5000))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."comments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."comments_id_seq" OWNED BY "public"."comments"."id";



CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "status" "text" DEFAULT 'approved'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" bigint NOT NULL,
    "nickname" "text",
    "left_at" timestamp with time zone,
    CONSTRAINT "group_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text", 'moderator'::"text"]))),
    CONSTRAINT "group_members_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'left'::"text"])))
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


ALTER TABLE "public"."group_members" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."group_members_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "owner_id" "uuid",
    "join_mode" "text" DEFAULT 'invite_only'::"text" NOT NULL,
    "invite_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "groups_description_length" CHECK (("length"("description") <= 1000)),
    CONSTRAINT "groups_join_mode_check" CHECK (("join_mode" = ANY (ARRAY['invite_only'::"text", 'request_approve'::"text", 'code_join'::"text"]))),
    CONSTRAINT "groups_name_length" CHECK (("length"("name") <= 100))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."groups_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."groups_id_seq" OWNED BY "public"."groups"."id";



CREATE TABLE IF NOT EXISTS "public"."post_analysis" (
    "id" bigint NOT NULL,
    "post_id" bigint NOT NULL,
    "emotions" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "analyzed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_analysis" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."post_analysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."post_analysis_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."post_analysis_id_seq" OWNED BY "public"."post_analysis"."id";



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "author" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "board_id" bigint,
    "group_id" bigint,
    "is_anonymous" boolean DEFAULT true NOT NULL,
    "display_name" "text" DEFAULT '익명'::"text" NOT NULL,
    "member_id" bigint,
    "deleted_at" timestamp with time zone,
    "image_url" "text",
    CONSTRAINT "posts_content_length" CHECK (("length"("content") <= 100000)),
    CONSTRAINT "posts_title_length" CHECK (("length"("title") <= 200))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."posts" IS '게시글. 감정 분석 자동 호출은 Database Webhooks(posts INSERT → analyze-post)로 설정하세요.';



CREATE SEQUENCE IF NOT EXISTS "public"."posts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."posts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."posts_id_seq" OWNED BY "public"."posts"."id";



CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" bigint NOT NULL,
    "post_id" bigint NOT NULL,
    "reaction_type" "text" NOT NULL,
    "count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."posts_with_like_count" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."title",
    "p"."content",
    "p"."author",
    "p"."author_id",
    "p"."created_at",
    "p"."board_id",
    "p"."group_id",
    "p"."is_anonymous",
    "p"."display_name",
    "p"."member_id",
    "p"."image_url",
    (COALESCE(( SELECT "sum"("r"."count") AS "sum"
           FROM "public"."reactions" "r"
          WHERE ("r"."post_id" = "p"."id")), (0)::bigint))::integer AS "like_count",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."comments" "c"
          WHERE (("c"."post_id" = "p"."id") AND ("c"."deleted_at" IS NULL))) AS "comment_count",
    COALESCE("pa"."emotions", ARRAY[]::"text"[]) AS "emotions"
   FROM ("public"."posts" "p"
     LEFT JOIN "public"."post_analysis" "pa" ON (("pa"."post_id" = "p"."id")))
  WHERE ("p"."deleted_at" IS NULL);


ALTER VIEW "public"."posts_with_like_count" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."reactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."reactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."reactions_id_seq" OWNED BY "public"."reactions"."id";



CREATE TABLE IF NOT EXISTS "public"."user_reactions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" bigint NOT NULL,
    "reaction_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_reactions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_reactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_reactions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_reactions_id_seq" OWNED BY "public"."user_reactions"."id";



ALTER TABLE ONLY "public"."boards" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."boards_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."comments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."comments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."groups" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."groups_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."post_analysis" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."post_analysis_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."posts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."posts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."reactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reactions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_reactions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_reactions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."app_admin"
    ADD CONSTRAINT "app_admin_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_invite_code_unique" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_analysis"
    ADD CONSTRAINT "post_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_analysis"
    ADD CONSTRAINT "post_analysis_post_id_key" UNIQUE ("post_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_post_id_reaction_type_key" UNIQUE ("post_id", "reaction_type");



ALTER TABLE ONLY "public"."user_reactions"
    ADD CONSTRAINT "user_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_reactions"
    ADD CONSTRAINT "user_reactions_user_id_post_id_reaction_type_key" UNIQUE ("user_id", "post_id", "reaction_type");



CREATE INDEX "idx_boards_group_id" ON "public"."boards" USING "btree" ("group_id");



CREATE INDEX "idx_boards_visibility" ON "public"."boards" USING "btree" ("visibility");



CREATE INDEX "idx_comments_author_id" ON "public"."comments" USING "btree" ("author_id");



CREATE INDEX "idx_comments_author_id_created_at" ON "public"."comments" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_comments_board_id" ON "public"."comments" USING "btree" ("board_id");



CREATE INDEX "idx_comments_deleted_at" ON "public"."comments" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_comments_group_id" ON "public"."comments" USING "btree" ("group_id");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_group_members_approved" ON "public"."group_members" USING "btree" ("group_id", "user_id") WHERE ("status" = 'approved'::"text");



CREATE INDEX "idx_group_members_left_at" ON "public"."group_members" USING "btree" ("left_at") WHERE ("left_at" IS NOT NULL);



CREATE INDEX "idx_group_members_lookup" ON "public"."group_members" USING "btree" ("group_id", "user_id", "status");



CREATE INDEX "idx_group_members_user_id" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_groups_invite_code" ON "public"."groups" USING "btree" ("invite_code");



CREATE INDEX "idx_groups_owner_id" ON "public"."groups" USING "btree" ("owner_id");



CREATE INDEX "idx_post_analysis_emotions" ON "public"."post_analysis" USING "gin" ("emotions");



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_author_id_created_at" ON "public"."posts" USING "btree" ("author_id", "created_at" DESC);



CREATE INDEX "idx_posts_board_created_at" ON "public"."posts" USING "btree" ("board_id", "created_at" DESC);



CREATE INDEX "idx_posts_board_id" ON "public"."posts" USING "btree" ("board_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_deleted_at" ON "public"."posts" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NOT NULL);



CREATE INDEX "idx_posts_group_created_at" ON "public"."posts" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "idx_posts_group_id" ON "public"."posts" USING "btree" ("group_id");



CREATE INDEX "idx_posts_member_id" ON "public"."posts" USING "btree" ("member_id");



CREATE INDEX "idx_reactions_post_id" ON "public"."reactions" USING "btree" ("post_id");



CREATE OR REPLACE TRIGGER "analyze_post_on_insert" AFTER INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://qwrjebpsjjdxhhhllqcw.supabase.co/functions/v1/analyze-post', 'POST', '{"Content-Type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "trg_boards_updated_at" BEFORE UPDATE ON "public"."boards" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_check_daily_comment_limit" BEFORE INSERT ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."check_daily_comment_limit"();



CREATE OR REPLACE TRIGGER "trg_check_daily_post_limit" BEFORE INSERT ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."check_daily_post_limit"();



CREATE OR REPLACE TRIGGER "trg_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_groups_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."app_admin"
    ADD CONSTRAINT "app_admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."boards"
    ADD CONSTRAINT "boards_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."post_analysis"
    ADD CONSTRAINT "post_analysis_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."group_members"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reactions"
    ADD CONSTRAINT "user_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reactions"
    ADD CONSTRAINT "user_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Authenticated users can create posts" ON "public"."posts" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



CREATE POLICY "Everyone can read boards" ON "public"."boards" FOR SELECT USING (true);



CREATE POLICY "Everyone can read comments" ON "public"."comments" FOR SELECT USING ((("deleted_at" IS NULL) AND (("group_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "comments"."group_id") AND ("gm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gm"."status" = 'approved'::"text")))))));



CREATE POLICY "Everyone can read groups" ON "public"."groups" FOR SELECT USING (true);



CREATE POLICY "Everyone can read posts" ON "public"."posts" FOR SELECT USING ((("deleted_at" IS NULL) AND (("group_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "posts"."group_id") AND ("gm"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("gm"."status" = 'approved'::"text")))))));



CREATE POLICY "Everyone can read reactions" ON "public"."reactions" FOR SELECT USING (true);



CREATE POLICY "Only app_admin can create boards" ON "public"."boards" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "app_admin"."user_id"
   FROM "public"."app_admin")));



CREATE POLICY "Only app_admin can create groups as owner" ON "public"."groups" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "app_admin"."user_id"
   FROM "public"."app_admin")) AND ("owner_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "Users can join groups" ON "public"."group_members" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can read group_members" ON "public"."group_members" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (("status" = 'approved'::"text") AND ("left_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "group_members"."group_id") AND ("gm"."user_id" = "auth"."uid"()) AND ("gm"."status" = 'approved'::"text") AND ("gm"."left_at" IS NULL)))))));



CREATE POLICY "Users can read own app_admin row" ON "public"."app_admin" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own comments" ON "public"."comments" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



CREATE POLICY "Users can update own group_members" ON "public"."group_members" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "author_id")) WITH CHECK (("auth"."uid"() = "author_id"));



ALTER TABLE "public"."app_admin" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."boards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_analysis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_analysis_select" ON "public"."post_analysis" FOR SELECT USING (true);



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_reactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_reactions_delete" ON "public"."user_reactions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "user_reactions_insert" ON "public"."user_reactions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "user_reactions_select" ON "public"."user_reactions" FOR SELECT USING (true);



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."app_admin" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."app_admin" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."app_admin" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."boards" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."boards" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."boards" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."boards_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."boards_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."boards_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comments" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comments" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."comments" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."comments_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."comments_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."comments_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."group_members" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."group_members" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."group_members" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."group_members_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."group_members_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."group_members_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."groups" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."groups" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."groups" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."groups_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."groups_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."groups_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_analysis" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_analysis" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."post_analysis" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."post_analysis_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."post_analysis_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."post_analysis_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."posts_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."posts_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."posts_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."reactions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."reactions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."reactions" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts_with_like_count" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts_with_like_count" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."posts_with_like_count" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."reactions_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."reactions_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."reactions_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_reactions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_reactions" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_reactions" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."user_reactions_id_seq" TO "anon";
GRANT SELECT,USAGE ON SEQUENCE "public"."user_reactions_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."user_reactions_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "service_role";




