const supabase = require('../config/supabase');

const submitPayment = async (
  user_id,
  {
    ad_id,
    package_id,
    amount,
    proof_url,
    payment_method,
    reference_no,
    sender_name,
    sender_bank_name,
    sender_account_number,
    sender_iban,
  }
) => {
  // Verify ad belongs to user and is in payment_pending
  const { data: ad } = await supabase.from('ads').select('*').eq('id', ad_id).eq('user_id', user_id).maybeSingle();
  if (!ad) throw { status: 404, message: 'Ad not found' };
  if (ad.status !== 'payment_pending' && ad.status !== 'draft' && ad.status !== 'submitted') throw { status: 422, message: 'Ad is not awaiting payment' };

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      ad_id,
      user_id,
      package_id,
      amount,
      proof_url,
      payment_method,
      reference_no,
      sender_name,
      sender_bank_name,
      sender_account_number,
      sender_iban,
      status: 'submitted',
    })
    .select('*')
    .single();

  if (error) throw error;

  // Move ad to payment_submitted
  await supabase.from('ads').update({ status: 'payment_submitted', package_id }).eq('id', ad_id);
  await supabase.from('ad_status_history').insert({ ad_id, from_status: 'payment_pending', to_status: 'payment_submitted', changed_by: user_id });

  // Notify admin
  const { data: admins } = await supabase.from('users').select('id').in('role', ['admin', 'super_admin']);
  if (admins?.length) {
    const notifications = admins.map(a => ({
      user_id: a.id,
      title: 'New Payment Submitted',
      body: `Payment proof submitted for ad ID: ${ad_id.substring(0, 8)}...`,
      type: 'info',
      ad_id,
    }));
    await supabase.from('notifications').insert(notifications);
  }

  return payment;
};

const getPaymentQueue = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select(`*, ad:ads(title, slug, status), user:users!payments_user_id_fkey(full_name, email), package:packages(name, price, duration_days)`)
    .eq('status', 'submitted')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

const verifyPayment = async (admin_id, payment_id, { action, rejection_note }) => {
  const { data: payment } = await supabase.from('payments').select('*, ad:ads(*)').eq('id', payment_id).maybeSingle();
  if (!payment) throw { status: 404, message: 'Payment not found' };

  const newPaymentStatus = action === 'verify' ? 'verified' : 'rejected';
  const now = new Date().toISOString();

  await supabase.from('payments').update({
    status: newPaymentStatus,
    verified_by: admin_id,
    verified_at: now,
    rejection_note: rejection_note || null,
  }).eq('id', payment_id);

  if (action === 'verify') {
    await supabase.from('ads').update({ status: 'payment_verified' }).eq('id', payment.ad_id);
    await supabase.from('ad_status_history').insert({
      ad_id: payment.ad_id, from_status: 'payment_submitted', to_status: 'payment_verified', changed_by: admin_id,
    });
    await supabase.from('notifications').insert({
      user_id: payment.user_id,
      title: 'Payment Verified ✅',
      body: 'Your payment has been verified. Your ad will be published shortly.',
      type: 'success',
      ad_id: payment.ad_id,
    });
  } else {
    await supabase.from('ads').update({ status: 'payment_pending' }).eq('id', payment.ad_id);
    await supabase.from('notifications').insert({
      user_id: payment.user_id,
      title: 'Payment Rejected',
      body: rejection_note || 'Your payment proof was rejected. Please resubmit.',
      type: 'error',
      ad_id: payment.ad_id,
    });
  }

  return { action, payment_id };
};

module.exports = { submitPayment, getPaymentQueue, verifyPayment };
